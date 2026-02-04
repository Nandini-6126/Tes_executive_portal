"""
Tasks API Endpoints
Manage tasks, assignments, and AI-powered task generation/recommendations.
"""

import json
import os
from typing import Optional, List
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.api.deps import get_db, get_current_user
from app.models import User, Service
from app.models.employee import Employee, Skill, employee_skills, SkillProficiency
from app.models.task import Task, TaskAssignment, TaskStatus, TaskPriority
from app.schemas.task import (
    TaskCreate, TaskUpdate, TaskResponse, TaskListResponse,
    TaskAssignmentCreate, TaskAssignmentResponse,
    AITaskGenerationRequest, AITaskGenerationResponse, AIGeneratedTask,
    AIEmployeeRecommendationRequest, AIEmployeeRecommendationResponse, AIEmployeeRecommendation
)

router = APIRouter(prefix="/tasks", tags=["Tasks"])


def task_to_response(task: Task, db: Session) -> TaskResponse:
    """Convert Task model to response schema."""
    # Get service and client info
    service = task.service
    client_name = None
    if service and service.client:
        client_name = service.client.name
    elif service:
        client_name = service.customer_name
    
    # Get assignments
    assignments = []
    current_assignee_id = None
    current_assignee_name = None
    
    for assignment in task.assignments:
        emp = assignment.employee
        assignments.append(TaskAssignmentResponse(
            id=assignment.id,
            task_id=assignment.task_id,
            employee_id=assignment.employee_id,
            employee_name=emp.full_name if emp else "Unknown",
            is_active=assignment.is_active,
            assigned_hours=assignment.assigned_hours,
            is_ai_recommended=assignment.is_ai_recommended,
            ai_match_score=assignment.ai_match_score,
            ai_reasoning=assignment.ai_reasoning,
            assigned_at=assignment.assigned_at,
        ))
        
        if assignment.is_active and emp:
            current_assignee_id = emp.id
            current_assignee_name = emp.full_name
    
    # Parse required skills
    required_skills = []
    if task.required_skills:
        try:
            required_skills = json.loads(task.required_skills)
        except:
            required_skills = [s.strip() for s in task.required_skills.split(',')]
    
    return TaskResponse(
        id=task.id,
        title=task.title,
        description=task.description,
        service_id=task.service_id,
        service_name=service.name if service else None,
        client_name=client_name,
        status=task.status,
        priority=task.priority,
        estimated_hours=task.estimated_hours,
        actual_hours=task.actual_hours,
        required_skills=required_skills,
        start_date=task.start_date,
        due_date=task.due_date,
        completed_date=task.completed_date,
        progress_percentage=task.progress_percentage,
        is_ai_generated=task.is_ai_generated,
        ai_reasoning=task.ai_reasoning,
        is_assigned=task.is_assigned,
        current_assignee_id=current_assignee_id,
        current_assignee_name=current_assignee_name,
        assignments=assignments,
        created_by_id=task.created_by_id,
        created_at=task.created_at,
        updated_at=task.updated_at,
    )


@router.get("", response_model=TaskListResponse)
async def get_tasks(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    service_id: Optional[int] = None,
    status: Optional[TaskStatus] = None,
    priority: Optional[TaskPriority] = None,
    assigned: Optional[bool] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get tasks for services managed by current user."""
    query = db.query(Task).join(Service).filter(Task.is_deleted == 0)
    
    # Filter by manager for non-admin users
    if current_user.role.name != "admin":
        query = query.filter(Service.manager_id == current_user.id)
    
    # Filters
    if service_id:
        query = query.filter(Task.service_id == service_id)
    
    if status:
        query = query.filter(Task.status == status)
    
    if priority:
        query = query.filter(Task.priority == priority)
    
    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            (Task.title.ilike(search_filter)) |
            (Task.description.ilike(search_filter))
        )
    
    # Get total count
    total = query.count()
    
    # Paginate
    tasks = query.order_by(Task.created_at.desc()).offset(
        (page - 1) * page_size
    ).limit(page_size).all()
    
    # Filter by assignment status after fetching (since it's a computed property)
    result_tasks = []
    for task in tasks:
        if assigned is not None:
            if assigned and task.is_assigned:
                result_tasks.append(task)
            elif not assigned and not task.is_assigned:
                result_tasks.append(task)
        else:
            result_tasks.append(task)
    
    return TaskListResponse(
        data=[task_to_response(t, db) for t in result_tasks],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=(total + page_size - 1) // page_size,
    )


@router.post("", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
async def create_task(
    task_data: TaskCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new task manually."""
    # Verify service access
    service = db.query(Service).filter(
        Service.id == task_data.service_id,
        Service.is_deleted == 0
    ).first()
    
    if not service:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Service not found"
        )
    
    if current_user.role.name != "admin" and service.manager_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to create tasks for this service"
        )
    
    # Create task
    task_dict = task_data.model_dump()
    required_skills = task_dict.pop('required_skills', None)
    
    task = Task(
        **task_dict,
        required_skills=json.dumps(required_skills) if required_skills else None,
        created_by_id=current_user.id,
        is_ai_generated=False,
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    
    return task_to_response(task, db)


@router.get("/{task_id}", response_model=TaskResponse)
async def get_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a specific task."""
    task = db.query(Task).join(Service).filter(
        Task.id == task_id,
        Task.is_deleted == 0
    ).first()
    
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )
    
    # Check access
    if current_user.role.name != "admin" and task.service.manager_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this task"
        )
    
    return task_to_response(task, db)


@router.put("/{task_id}", response_model=TaskResponse)
async def update_task(
    task_id: int,
    task_data: TaskUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update a task."""
    task = db.query(Task).join(Service).filter(
        Task.id == task_id,
        Task.is_deleted == 0
    ).first()
    
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )
    
    if current_user.role.name != "admin" and task.service.manager_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this task"
        )
    
    # Update fields
    update_data = task_data.model_dump(exclude_unset=True)
    
    # Handle required_skills specially
    if 'required_skills' in update_data:
        update_data['required_skills'] = json.dumps(update_data['required_skills']) if update_data['required_skills'] else None
    
    for field, value in update_data.items():
        setattr(task, field, value)
    
    # Handle status changes
    if task_data.status == TaskStatus.COMPLETED:
        task.completed_date = datetime.now(timezone.utc).date()
        task.progress_percentage = 100
    
    db.commit()
    db.refresh(task)
    
    return task_to_response(task, db)


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Soft delete a task."""
    task = db.query(Task).join(Service).filter(
        Task.id == task_id,
        Task.is_deleted == 0
    ).first()
    
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )
    
    if current_user.role.name != "admin" and task.service.manager_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this task"
        )
    
    task.is_deleted = 1
    db.commit()
    
    return None


@router.post("/{task_id}/assign", response_model=TaskAssignmentResponse)
async def assign_task(
    task_id: int,
    assignment_data: TaskAssignmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Assign a task to an employee."""
    # Get task
    task = db.query(Task).join(Service).filter(
        Task.id == task_id,
        Task.is_deleted == 0
    ).first()
    
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )
    
    if current_user.role.name != "admin" and task.service.manager_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to assign this task"
        )
    
    # Get employee
    employee = db.query(Employee).filter(
        Employee.id == assignment_data.employee_id,
        Employee.is_deleted == 0,
        Employee.is_active == True
    ).first()
    
    if not employee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Employee not found"
        )
    
    # Deactivate existing assignments
    db.query(TaskAssignment).filter(
        TaskAssignment.task_id == task_id,
        TaskAssignment.is_active == True
    ).update({"is_active": False})
    
    # Create new assignment
    assigned_hours = assignment_data.assigned_hours or task.estimated_hours
    
    assignment = TaskAssignment(
        task_id=task_id,
        employee_id=employee.id,
        assigned_hours=assigned_hours,
        is_ai_recommended=assignment_data.is_ai_recommended,
        ai_match_score=assignment_data.ai_match_score,
        ai_reasoning=assignment_data.ai_reasoning,
        assigned_by_id=current_user.id,
    )
    db.add(assignment)
    
    # Update task status
    if task.status == TaskStatus.PENDING:
        task.status = TaskStatus.ASSIGNED
    
    # Update employee workload
    employee.current_workload_hours += assigned_hours
    
    db.commit()
    db.refresh(assignment)
    
    return TaskAssignmentResponse(
        id=assignment.id,
        task_id=assignment.task_id,
        employee_id=assignment.employee_id,
        employee_name=employee.full_name,
        is_active=assignment.is_active,
        assigned_hours=assignment.assigned_hours,
        is_ai_recommended=assignment.is_ai_recommended,
        ai_match_score=assignment.ai_match_score,
        ai_reasoning=assignment.ai_reasoning,
        assigned_at=assignment.assigned_at,
    )


@router.post("/ai/generate", response_model=AITaskGenerationResponse)
async def ai_generate_tasks(
    request: AITaskGenerationRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Use AI to analyze a service and generate task breakdown.
    Requires ANTHROPIC_API_KEY environment variable.
    """
    # Get service
    service = db.query(Service).filter(
        Service.id == request.service_id,
        Service.is_deleted == 0
    ).first()
    
    if not service:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Service not found"
        )
    
    if current_user.role.name != "admin" and service.manager_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to generate tasks for this service"
        )
    
    # Check for API key
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        # Return mock response for demo
        return _generate_mock_tasks(service, request.additional_context)
    
    try:
        import anthropic
        client = anthropic.Anthropic(api_key=api_key)
        
        # Build prompt
        prompt = f"""Analyze the following service/project and break it down into specific, actionable tasks.

Service Name: {service.name}
Description: {service.description or 'No description provided'}
Customer: {service.customer_name}
Contract Value: ${service.contract_value or 'Not specified'}
Resource Count: {service.resource_count or 'Not specified'}

Additional Context: {request.additional_context or 'None'}

Please provide a task breakdown in JSON format with the following structure:
{{
    "analysis_summary": "Brief analysis of the service requirements",
    "tasks": [
        {{
            "title": "Task title",
            "description": "Detailed description",
            "priority": "low|medium|high|critical",
            "estimated_hours": number,
            "required_skills": ["skill1", "skill2"],
            "reasoning": "Why this task is needed"
        }}
    ]
}}

Generate 5-10 realistic tasks based on the service type and requirements."""

        message = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=2000,
            messages=[{"role": "user", "content": prompt}]
        )
        
        # Parse response
        response_text = message.content[0].text
        
        # Extract JSON from response
        import re
        json_match = re.search(r'\{[\s\S]*\}', response_text)
        if json_match:
            result = json.loads(json_match.group())
            
            tasks = [
                AIGeneratedTask(
                    title=t['title'],
                    description=t['description'],
                    priority=TaskPriority(t['priority']),
                    estimated_hours=float(t['estimated_hours']),
                    required_skills=t['required_skills'],
                    reasoning=t['reasoning']
                )
                for t in result.get('tasks', [])
            ]
            
            return AITaskGenerationResponse(
                service_id=service.id,
                service_name=service.name,
                tasks=tasks,
                analysis_summary=result.get('analysis_summary', '')
            )
        
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to parse AI response"
        )
        
    except ImportError:
        return _generate_mock_tasks(service, request.additional_context)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"AI generation failed: {str(e)}"
        )


def _generate_mock_tasks(service: Service, context: Optional[str]) -> AITaskGenerationResponse:
    """Generate mock tasks when AI is not available."""
    tasks = [
        AIGeneratedTask(
            title="Requirements Analysis & Documentation",
            description=f"Analyze and document all requirements for {service.name}",
            priority=TaskPriority.HIGH,
            estimated_hours=16,
            required_skills=["Requirements Analysis", "Documentation", "Communication"],
            reasoning="Foundation task to understand project scope"
        ),
        AIGeneratedTask(
            title="Technical Architecture Design",
            description="Design the technical architecture and system components",
            priority=TaskPriority.HIGH,
            estimated_hours=24,
            required_skills=["System Design", "Architecture", "Technical Leadership"],
            reasoning="Critical for establishing technical foundation"
        ),
        AIGeneratedTask(
            title="Development Environment Setup",
            description="Set up development, staging, and production environments",
            priority=TaskPriority.MEDIUM,
            estimated_hours=8,
            required_skills=["DevOps", "Cloud", "Infrastructure"],
            reasoning="Required before development can begin"
        ),
        AIGeneratedTask(
            title="Core Feature Development",
            description="Implement the core features and functionality",
            priority=TaskPriority.HIGH,
            estimated_hours=80,
            required_skills=["Programming", "Backend Development", "Frontend Development"],
            reasoning="Main deliverable of the project"
        ),
        AIGeneratedTask(
            title="Testing & Quality Assurance",
            description="Comprehensive testing including unit, integration, and user acceptance testing",
            priority=TaskPriority.HIGH,
            estimated_hours=32,
            required_skills=["Testing", "QA", "Test Automation"],
            reasoning="Ensures quality and reliability"
        ),
        AIGeneratedTask(
            title="Documentation & Training",
            description="Create user documentation and conduct training sessions",
            priority=TaskPriority.MEDIUM,
            estimated_hours=16,
            required_skills=["Documentation", "Training", "Communication"],
            reasoning="Required for successful handover"
        ),
    ]
    
    return AITaskGenerationResponse(
        service_id=service.id,
        service_name=service.name,
        tasks=tasks,
        analysis_summary=f"Analysis of {service.name}: This is a demo task breakdown. Configure ANTHROPIC_API_KEY for AI-powered analysis."
    )


@router.post("/ai/recommend-employees", response_model=AIEmployeeRecommendationResponse)
async def ai_recommend_employees(
    request: AIEmployeeRecommendationRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get AI-powered employee recommendations for a task.
    Analyzes employee skills, workload, and availability.
    """
    # Get task
    task = db.query(Task).join(Service).filter(
        Task.id == request.task_id,
        Task.is_deleted == 0
    ).first()
    
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )
    
    if current_user.role.name != "admin" and task.service.manager_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to get recommendations for this task"
        )
    
    # Get required skills
    required_skills = []
    if task.required_skills:
        try:
            required_skills = json.loads(task.required_skills)
        except:
            required_skills = [s.strip() for s in task.required_skills.split(',')]
    
    # Get employees managed by current user
    employees = db.query(Employee).filter(
        Employee.manager_id == current_user.id,
        Employee.is_deleted == 0,
        Employee.is_active == True
    ).all()
    
    recommendations = []
    
    for emp in employees:
        # Get employee skills
        emp_skills = db.execute(
            employee_skills.select().where(employee_skills.c.employee_id == emp.id)
        ).fetchall()
        
        emp_skill_names = []
        for row in emp_skills:
            skill = db.query(Skill).get(row.skill_id)
            if skill:
                emp_skill_names.append(skill.name.lower())
        
        # Calculate skill match score
        matching_skills = []
        for req_skill in required_skills:
            for emp_skill in emp_skill_names:
                if req_skill.lower() in emp_skill or emp_skill in req_skill.lower():
                    matching_skills.append(req_skill)
                    break
        
        skill_match_score = (len(matching_skills) / len(required_skills) * 100) if required_skills else 50
        
        # Calculate availability score
        available_hours = emp.available_hours
        availability_score = min(100, (available_hours / task.estimated_hours * 100)) if task.estimated_hours > 0 else 100
        
        # Calculate workload score (inverse of current workload)
        workload_score = max(0, 100 - emp.workload_percentage)
        
        # Calculate overall score (weighted average)
        overall_score = (skill_match_score * 0.5) + (availability_score * 0.3) + (workload_score * 0.2)
        
        # Generate reasoning
        reasoning_parts = []
        if skill_match_score >= 80:
            reasoning_parts.append(f"Excellent skill match ({', '.join(matching_skills)})")
        elif skill_match_score >= 50:
            reasoning_parts.append(f"Good skill coverage ({', '.join(matching_skills) if matching_skills else 'partial match'})")
        else:
            reasoning_parts.append("Limited skill match - may need training")
        
        if availability_score >= 80:
            reasoning_parts.append(f"Has capacity ({available_hours:.0f}h available)")
        elif availability_score >= 50:
            reasoning_parts.append("Moderate availability")
        else:
            reasoning_parts.append("High workload - may need adjustment")
        
        recommendations.append(AIEmployeeRecommendation(
            employee_id=emp.id,
            employee_name=emp.full_name,
            overall_score=round(overall_score, 1),
            skill_match_score=round(skill_match_score, 1),
            availability_score=round(availability_score, 1),
            workload_score=round(workload_score, 1),
            matching_skills=matching_skills,
            reasoning=". ".join(reasoning_parts) + "."
        ))
    
    # Sort by overall score and take top N
    recommendations.sort(key=lambda x: x.overall_score, reverse=True)
    top_recommendations = recommendations[:request.top_n]
    
    return AIEmployeeRecommendationResponse(
        task_id=task.id,
        task_title=task.title,
        recommendations=top_recommendations
    )


@router.post("/ai/generate-and-save")
async def ai_generate_and_save_tasks(
    request: AITaskGenerationRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Generate tasks using AI and save them to the database."""
    # First generate tasks
    generation_response = await ai_generate_tasks(request, db, current_user)
    
    # Save tasks to database
    saved_tasks = []
    for ai_task in generation_response.tasks:
        task = Task(
            service_id=request.service_id,
            title=ai_task.title,
            description=ai_task.description,
            priority=ai_task.priority,
            estimated_hours=ai_task.estimated_hours,
            required_skills=json.dumps(ai_task.required_skills),
            is_ai_generated=True,
            ai_reasoning=ai_task.reasoning,
            created_by_id=current_user.id,
        )
        db.add(task)
        saved_tasks.append(task)
    
    db.commit()
    
    return {
        "success": True,
        "tasks_created": len(saved_tasks),
        "analysis_summary": generation_response.analysis_summary,
        "tasks": [task_to_response(t, db) for t in saved_tasks]
    }
