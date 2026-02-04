"""
Employees API Endpoints
Manage employees and their skills.
"""

import json
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import func
import pandas as pd
import io

from app.api.deps import get_db, get_current_user
from app.models import User
from app.models.employee import Employee, Skill, AvailabilityStatus, SkillProficiency, employee_skills
from app.models.task import TaskAssignment
from app.schemas.employee import (
    SkillCreate, SkillResponse,
    EmployeeCreate, EmployeeUpdate, EmployeeResponse, 
    EmployeeListResponse, EmployeeSkillInfo,
    EmployeeBulkImport, EmployeeBulkImportResult
)

router = APIRouter(prefix="/employees", tags=["Employees"])


def get_employee_skills(employee: Employee, db: Session) -> List[EmployeeSkillInfo]:
    """Get skills with proficiency for an employee."""
    result = db.execute(
        employee_skills.select().where(employee_skills.c.employee_id == employee.id)
    ).fetchall()
    
    skills_info = []
    for row in result:
        skill = db.query(Skill).get(row.skill_id)
        if skill:
            skills_info.append(EmployeeSkillInfo(
                skill_id=skill.id,
                skill_name=skill.name,
                proficiency=row.proficiency or SkillProficiency.INTERMEDIATE,
                years_experience=row.years_experience or 0,
            ))
    return skills_info


def employee_to_response(employee: Employee, db: Session) -> EmployeeResponse:
    """Convert Employee model to response schema."""
    # Count active tasks
    active_tasks = db.query(func.count(TaskAssignment.id)).filter(
        TaskAssignment.employee_id == employee.id,
        TaskAssignment.is_active == True
    ).scalar() or 0
    
    return EmployeeResponse(
        id=employee.id,
        employee_id=employee.employee_id,
        first_name=employee.first_name,
        last_name=employee.last_name,
        email=employee.email,
        phone=employee.phone,
        job_title=employee.job_title,
        department=employee.department,
        weekly_capacity_hours=employee.weekly_capacity_hours,
        hire_date=employee.hire_date,
        full_name=employee.full_name,
        availability_status=employee.availability_status,
        current_workload_hours=employee.current_workload_hours,
        available_hours=employee.available_hours,
        workload_percentage=employee.workload_percentage,
        is_active=employee.is_active,
        manager_id=employee.manager_id,
        manager_name=employee.manager.full_name if employee.manager else None,
        skills=get_employee_skills(employee, db),
        active_tasks_count=active_tasks,
        created_at=employee.created_at,
        updated_at=employee.updated_at,
    )


@router.get("", response_model=EmployeeListResponse)
async def get_employees(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    availability: Optional[AvailabilityStatus] = None,
    skill_id: Optional[int] = None,
    is_active: Optional[bool] = True,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get all employees managed by current user."""
    query = db.query(Employee).filter(Employee.is_deleted == 0)
    
    # Filter by manager for non-admin users
    if current_user.role.name != "admin":
        query = query.filter(Employee.manager_id == current_user.id)
    
    # Search filter
    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            (Employee.first_name.ilike(search_filter)) |
            (Employee.last_name.ilike(search_filter)) |
            (Employee.email.ilike(search_filter)) |
            (Employee.job_title.ilike(search_filter))
        )
    
    # Availability filter
    if availability:
        query = query.filter(Employee.availability_status == availability)
    
    # Skill filter
    if skill_id:
        query = query.join(employee_skills).filter(
            employee_skills.c.skill_id == skill_id
        )
    
    # Active filter
    if is_active is not None:
        query = query.filter(Employee.is_active == is_active)
    
    # Get total count
    total = query.count()
    
    # Paginate
    employees = query.order_by(Employee.created_at.desc()).offset(
        (page - 1) * page_size
    ).limit(page_size).all()
    
    return EmployeeListResponse(
        data=[employee_to_response(e, db) for e in employees],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=(total + page_size - 1) // page_size,
    )


@router.post("", response_model=EmployeeResponse, status_code=status.HTTP_201_CREATED)
async def create_employee(
    employee_data: EmployeeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new employee."""
    # Check for duplicate email
    existing = db.query(Employee).filter(
        Employee.email == employee_data.email,
        Employee.is_deleted == 0
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An employee with this email already exists"
        )
    
    # Create employee
    employee_dict = employee_data.model_dump(exclude={"skills"})
    employee = Employee(
        **employee_dict,
        manager_id=current_user.id,
    )
    db.add(employee)
    db.flush()  # Get ID
    
    # Add skills
    if employee_data.skills:
        for skill_info in employee_data.skills:
            # Find or create skill
            skill = db.query(Skill).filter(Skill.id == skill_info.skill_id).first()
            if skill:
                db.execute(employee_skills.insert().values(
                    employee_id=employee.id,
                    skill_id=skill.id,
                    proficiency=skill_info.proficiency,
                    years_experience=skill_info.years_experience,
                ))
    
    db.commit()
    db.refresh(employee)
    
    return employee_to_response(employee, db)


@router.get("/{employee_id}", response_model=EmployeeResponse)
async def get_employee(
    employee_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a specific employee."""
    query = db.query(Employee).filter(
        Employee.id == employee_id,
        Employee.is_deleted == 0
    )
    
    if current_user.role.name != "admin":
        query = query.filter(Employee.manager_id == current_user.id)
    
    employee = query.first()
    
    if not employee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Employee not found"
        )
    
    return employee_to_response(employee, db)


@router.put("/{employee_id}", response_model=EmployeeResponse)
async def update_employee(
    employee_id: int,
    employee_data: EmployeeUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update an employee."""
    query = db.query(Employee).filter(
        Employee.id == employee_id,
        Employee.is_deleted == 0
    )
    
    if current_user.role.name != "admin":
        query = query.filter(Employee.manager_id == current_user.id)
    
    employee = query.first()
    
    if not employee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Employee not found"
        )
    
    # Update fields
    update_data = employee_data.model_dump(exclude_unset=True, exclude={"skills"})
    for field, value in update_data.items():
        setattr(employee, field, value)
    
    # Update skills if provided
    if employee_data.skills is not None:
        # Remove existing skills
        db.execute(employee_skills.delete().where(
            employee_skills.c.employee_id == employee.id
        ))
        
        # Add new skills
        for skill_info in employee_data.skills:
            skill = db.query(Skill).filter(Skill.id == skill_info.skill_id).first()
            if skill:
                db.execute(employee_skills.insert().values(
                    employee_id=employee.id,
                    skill_id=skill.id,
                    proficiency=skill_info.proficiency,
                    years_experience=skill_info.years_experience,
                ))
    
    db.commit()
    db.refresh(employee)
    
    return employee_to_response(employee, db)


@router.delete("/{employee_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_employee(
    employee_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Soft delete an employee."""
    query = db.query(Employee).filter(
        Employee.id == employee_id,
        Employee.is_deleted == 0
    )
    
    if current_user.role.name != "admin":
        query = query.filter(Employee.manager_id == current_user.id)
    
    employee = query.first()
    
    if not employee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Employee not found"
        )
    
    employee.is_deleted = 1
    db.commit()
    
    return None


@router.post("/bulk-import", response_model=EmployeeBulkImportResult)
async def bulk_import_employees(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Bulk import employees from Excel/CSV file.
    Expected columns: first_name, last_name, email, phone, job_title, department, skills (comma-separated)
    """
    # Validate file type
    if not file.filename.endswith(('.xlsx', '.xls', '.csv')):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File must be Excel (.xlsx, .xls) or CSV (.csv)"
        )
    
    try:
        # Read file content
        content = await file.read()
        
        # Parse file
        if file.filename.endswith('.csv'):
            df = pd.read_csv(io.BytesIO(content))
        else:
            df = pd.read_excel(io.BytesIO(content))
        
        # Validate required columns
        required_columns = ['first_name', 'last_name', 'email']
        missing_columns = [col for col in required_columns if col not in df.columns]
        if missing_columns:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Missing required columns: {', '.join(missing_columns)}"
            )
        
        success_count = 0
        error_count = 0
        errors = []
        
        for idx, row in df.iterrows():
            try:
                # Check for existing email
                existing = db.query(Employee).filter(
                    Employee.email == row['email'],
                    Employee.is_deleted == 0
                ).first()
                
                if existing:
                    errors.append({
                        "row": idx + 2,
                        "email": row['email'],
                        "error": "Employee with this email already exists"
                    })
                    error_count += 1
                    continue
                
                # Create employee
                employee = Employee(
                    first_name=str(row['first_name']).strip(),
                    last_name=str(row['last_name']).strip(),
                    email=str(row['email']).strip().lower(),
                    phone=str(row.get('phone', '')).strip() if pd.notna(row.get('phone')) else None,
                    job_title=str(row.get('job_title', '')).strip() if pd.notna(row.get('job_title')) else None,
                    department=str(row.get('department', '')).strip() if pd.notna(row.get('department')) else None,
                    employee_id=str(row.get('employee_id', '')).strip() if pd.notna(row.get('employee_id')) else None,
                    manager_id=current_user.id,
                )
                db.add(employee)
                db.flush()
                
                # Handle skills if provided
                skills_str = row.get('skills', '')
                if pd.notna(skills_str) and str(skills_str).strip():
                    skill_names = [s.strip() for s in str(skills_str).split(',')]
                    for skill_name in skill_names:
                        if not skill_name:
                            continue
                        # Find or create skill
                        skill = db.query(Skill).filter(
                            Skill.name.ilike(skill_name)
                        ).first()
                        
                        if not skill:
                            skill = Skill(name=skill_name, category="Imported")
                            db.add(skill)
                            db.flush()
                        
                        # Link skill to employee
                        db.execute(employee_skills.insert().values(
                            employee_id=employee.id,
                            skill_id=skill.id,
                            proficiency=SkillProficiency.INTERMEDIATE,
                        ))
                
                success_count += 1
                
            except Exception as e:
                errors.append({
                    "row": idx + 2,
                    "email": row.get('email', 'unknown'),
                    "error": str(e)
                })
                error_count += 1
        
        db.commit()
        
        return EmployeeBulkImportResult(
            success_count=success_count,
            error_count=error_count,
            errors=errors
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error processing file: {str(e)}"
        )


# Skills endpoints
@router.get("/skills/all", response_model=List[SkillResponse])
async def get_all_skills(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get all available skills."""
    skills = db.query(Skill).filter(Skill.is_active == True).order_by(Skill.name).all()
    return skills


@router.post("/skills", response_model=SkillResponse, status_code=status.HTTP_201_CREATED)
async def create_skill(
    skill_data: SkillCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new skill."""
    existing = db.query(Skill).filter(
        Skill.name.ilike(skill_data.name)
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A skill with this name already exists"
        )
    
    skill = Skill(**skill_data.model_dump())
    db.add(skill)
    db.commit()
    db.refresh(skill)
    
    return skill
