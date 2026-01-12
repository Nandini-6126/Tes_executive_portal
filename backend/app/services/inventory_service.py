"""
Tessolve Executive Portal - Inventory Service
Business logic for inventory management with AI analysis.
"""

import anthropic
import json
import csv
import io
import base64
from datetime import datetime, timezone, timedelta
from decimal import Decimal
from typing import List, Dict, Any, Optional, Tuple
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func

from app.models.inventory import (
    Vendor, Component, ComponentVendor, BOM, BOMItem,
    InventoryRequest, RequestItem, RequestApproval, InventoryTransaction,
    ComponentType, ComponentCategory, RequestStatus, ApprovalStatus, ApprovalLevel
)
from app.models.service import Service
from app.models.user import User
from app.models.master_data import Department
from app.schemas.inventory import (
    VendorCreate, VendorUpdate, ComponentCreate, ComponentUpdate,
    BOMCreate, BOMItemCreate, InventoryRequestCreate, InventoryRequestUpdate,
    RequestItemCreate, ApprovalAction
)
from app.core.exceptions import NotFoundError, ValidationError


class InventoryService:
    """Service for inventory management operations."""
    
    def __init__(self, db: Session, anthropic_api_key: str = None):
        self.db = db
        self.anthropic_api_key = anthropic_api_key
        if anthropic_api_key:
            self.ai_client = anthropic.Anthropic(api_key=anthropic_api_key)
        else:
            self.ai_client = None
    
    # ==================== Vendor Operations ====================
    
    def create_vendor(self, data: VendorCreate) -> Vendor:
        """Create a new vendor."""
        vendor = Vendor(
            name=data.name,
            code=data.code,
            contact_person=data.contact_person,
            email=data.email,
            phone=data.phone,
            website=data.website,
            address=data.address,
            city=data.city,
            country=data.country,
            vendor_type=data.vendor_type,
            payment_terms=data.payment_terms,
            lead_time_days=data.lead_time_days,
            rating=data.rating,
            categories=data.categories,
            notes=data.notes,
            is_active=True
        )
        self.db.add(vendor)
        self.db.commit()
        self.db.refresh(vendor)
        return vendor
    
    def get_vendors(self, active_only: bool = True) -> List[Vendor]:
        """Get all vendors."""
        query = self.db.query(Vendor)
        if active_only:
            query = query.filter(Vendor.is_active == True)
        return query.order_by(Vendor.name).all()
    
    def get_vendor_by_id(self, vendor_id: int) -> Vendor:
        """Get vendor by ID."""
        vendor = self.db.query(Vendor).filter(Vendor.id == vendor_id).first()
        if not vendor:
            raise NotFoundError(f"Vendor {vendor_id} not found")
        return vendor
    
    def update_vendor(self, vendor_id: int, data: VendorUpdate) -> Vendor:
        """Update vendor."""
        vendor = self.get_vendor_by_id(vendor_id)
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(vendor, field, value)
        self.db.commit()
        self.db.refresh(vendor)
        return vendor
    
    # ==================== Component Operations ====================
    
    def create_component(self, data: ComponentCreate) -> Component:
        """Create a new component."""
        component = Component(
            name=data.name,
            sku=data.sku,
            part_number=data.part_number,
            component_type=ComponentType(data.component_type.value),
            category=ComponentCategory(data.category.value),
            description=data.description,
            specifications=data.specifications,
            quantity_in_stock=data.quantity_in_stock,
            minimum_stock_level=data.minimum_stock_level,
            unit_of_measure=data.unit_of_measure,
            unit_price=data.unit_price,
            currency=data.currency,
            license_type=data.license_type,
            version=data.version,
            is_active=True
        )
        self.db.add(component)
        self.db.commit()
        self.db.refresh(component)
        return component
    
    def get_components(
        self, 
        component_type: str = None,
        category: str = None,
        active_only: bool = True
    ) -> List[Component]:
        """Get components with optional filtering."""
        query = self.db.query(Component)
        
        if active_only:
            query = query.filter(Component.is_active == True)
        if component_type:
            query = query.filter(Component.component_type == ComponentType(component_type))
        if category:
            query = query.filter(Component.category == ComponentCategory(category))
        
        return query.order_by(Component.name).all()
    
    def get_component_by_id(self, component_id: int) -> Component:
        """Get component by ID."""
        component = self.db.query(Component).options(
            joinedload(Component.vendors).joinedload(ComponentVendor.vendor)
        ).filter(Component.id == component_id).first()
        if not component:
            raise NotFoundError(f"Component {component_id} not found")
        return component
    
    def get_low_stock_components(self) -> List[Component]:
        """Get components below minimum stock level."""
        return self.db.query(Component).filter(
            Component.is_active == True,
            Component.quantity_in_stock <= Component.minimum_stock_level
        ).all()
    
    # ==================== BOM Operations ====================
    
    def create_bom(self, data: BOMCreate, user_id: int) -> BOM:
        """Create a new Bill of Materials."""
        bom = BOM(
            name=data.name,
            version=data.version,
            service_id=data.service_id,
            description=data.description,
            created_by_id=user_id,
            ai_generated=False,
            is_active=True
        )
        self.db.add(bom)
        self.db.flush()
        
        # Add items
        if data.items:
            for item_data in data.items:
                item = BOMItem(
                    bom_id=bom.id,
                    component_id=item_data.component_id,
                    custom_name=item_data.custom_name,
                    custom_description=item_data.custom_description,
                    custom_type=ComponentType(item_data.custom_type.value) if item_data.custom_type else None,
                    custom_category=ComponentCategory(item_data.custom_category.value) if item_data.custom_category else None,
                    quantity=item_data.quantity,
                    unit_price=item_data.unit_price,
                    notes=item_data.notes
                )
                self.db.add(item)
        
        self.db.commit()
        self.db.refresh(bom)
        return bom
    
    def parse_bom_file(self, file_content: str, file_type: str) -> List[Dict[str, Any]]:
        """Parse uploaded BOM file."""
        try:
            content = base64.b64decode(file_content).decode('utf-8')
            
            if file_type == 'csv':
                reader = csv.DictReader(io.StringIO(content))
                items = list(reader)
            elif file_type == 'json':
                items = json.loads(content)
            else:
                raise ValidationError(f"Unsupported file type: {file_type}")
            
            return items
        except Exception as e:
            raise ValidationError(f"Failed to parse BOM file: {str(e)}")
    
    def get_boms(self, service_id: int = None) -> List[BOM]:
        """Get BOMs with optional service filter."""
        query = self.db.query(BOM).options(
            joinedload(BOM.items)
        ).filter(BOM.is_active == True)
        
        if service_id:
            query = query.filter(BOM.service_id == service_id)
        
        return query.order_by(BOM.created_at.desc()).all()
    
    def get_bom_by_id(self, bom_id: int) -> BOM:
        """Get BOM by ID."""
        bom = self.db.query(BOM).options(
            joinedload(BOM.items).joinedload(BOMItem.component)
        ).filter(BOM.id == bom_id).first()
        if not bom:
            raise NotFoundError(f"BOM {bom_id} not found")
        return bom
    
    # ==================== AI Analysis ====================
    
    def analyze_service_requirements(self, service_id: int, additional_context: str = None) -> Dict[str, Any]:
        """Use AI to analyze service requirements and suggest components."""
        if not self.ai_client:
            raise ValidationError("AI service not configured")
        
        # Get service details
        service = self.db.query(Service).options(
            joinedload(Service.technologies),
            joinedload(Service.sector)
        ).filter(Service.id == service_id).first()
        
        if not service:
            raise NotFoundError(f"Service {service_id} not found")
        
        # Get existing components for reference
        components = self.db.query(Component).filter(Component.is_active == True).all()
        component_list = [
            {
                "id": c.id,
                "name": c.name,
                "type": c.component_type.value,
                "category": c.category.value,
                "price": float(c.unit_price) if c.unit_price else None,
                "in_stock": c.quantity_in_stock
            }
            for c in components[:50]  # Limit for context
        ]
        
        # Get vendors
        vendors = self.db.query(Vendor).filter(Vendor.is_active == True).all()
        vendor_list = [
            {
                "id": v.id,
                "name": v.name,
                "type": v.vendor_type,
                "lead_time_days": v.lead_time_days,
                "categories": v.categories
            }
            for v in vendors[:20]
        ]
        
        # Build prompt
        prompt = f"""Analyze this service/project and recommend required components (hardware and software).

SERVICE DETAILS:
- Name: {service.name}
- Description: {service.description or 'Not provided'}
- Customer: {service.customer_name}
- Sector: {service.sector.name if service.sector else 'Not specified'}
- Technologies: {', '.join([t.name for t in service.technologies]) if service.technologies else 'Not specified'}
- Resources: {service.resource_count or 0} team members
- Contract Value: ${service.contract_value or 0:,.2f}

{f'ADDITIONAL CONTEXT: {additional_context}' if additional_context else ''}

AVAILABLE COMPONENTS IN INVENTORY:
{json.dumps(component_list, indent=2)}

AVAILABLE VENDORS:
{json.dumps(vendor_list, indent=2)}

Based on this information, provide:
1. A list of required HARDWARE components (servers, workstations, networking, etc.)
2. A list of required SOFTWARE components (operating systems, development tools, licenses, etc.)
3. For each component, suggest:
   - Name and description
   - Type (hardware/software)
   - Category
   - Estimated quantity needed
   - Priority (critical/high/medium/low)
   - If available in inventory, reference the component ID
   - If not available, suggest vendors that might supply it

Respond in JSON format:
{{
    "analysis_summary": "Brief analysis of the project requirements",
    "hardware_components": [
        {{
            "name": "Component name",
            "description": "What it's for",
            "category": "server/workstation/networking/etc",
            "quantity": 1,
            "priority": "critical/high/medium/low",
            "existing_component_id": null or ID,
            "estimated_unit_price": 0.00,
            "suggested_vendors": ["Vendor names"]
        }}
    ],
    "software_components": [
        {{
            "name": "Software name",
            "description": "What it's for",
            "category": "operating_system/development_tool/etc",
            "quantity": 1,
            "license_type": "perpetual/subscription/open-source",
            "priority": "critical/high/medium/low",
            "existing_component_id": null or ID,
            "estimated_unit_price": 0.00,
            "suggested_vendors": ["Vendor names"]
        }}
    ],
    "total_estimated_cost": 0.00,
    "estimated_procurement_time_days": 14,
    "recommendations": ["List of additional recommendations"],
    "risks": ["Potential risks or considerations"]
}}"""

        try:
            response = self.ai_client.messages.create(
                model="claude-sonnet-4-20250514",
                max_tokens=2048,
                messages=[{"role": "user", "content": prompt}]
            )
            
            # Parse JSON response
            response_text = response.content[0].text
            # Extract JSON from response
            if "```json" in response_text:
                response_text = response_text.split("```json")[1].split("```")[0]
            elif "```" in response_text:
                response_text = response_text.split("```")[1].split("```")[0]
            
            analysis = json.loads(response_text)
            return analysis
            
        except json.JSONDecodeError as e:
            return {
                "error": "Failed to parse AI response",
                "raw_response": response.content[0].text if response else None
            }
        except Exception as e:
            raise ValidationError(f"AI analysis failed: {str(e)}")
    
    def suggest_vendors(
        self, 
        component_name: str,
        component_type: str,
        category: str,
        quantity: int = 1,
        required_by_date: datetime = None
    ) -> Dict[str, Any]:
        """Use AI to suggest best vendors for a component."""
        if not self.ai_client:
            raise ValidationError("AI service not configured")
        
        # Get vendors
        vendors = self.db.query(Vendor).filter(Vendor.is_active == True).all()
        vendor_details = []
        for v in vendors:
            vendor_details.append({
                "id": v.id,
                "name": v.name,
                "type": v.vendor_type,
                "lead_time_days": v.lead_time_days,
                "categories": v.categories,
                "rating": float(v.rating) if v.rating else None,
                "payment_terms": v.payment_terms,
                "contact": v.email
            })
        
        days_until_required = None
        if required_by_date:
            days_until_required = (required_by_date - datetime.now()).days
        
        prompt = f"""Suggest the best vendors for this component:

COMPONENT:
- Name: {component_name}
- Type: {component_type}
- Category: {category}
- Quantity needed: {quantity}
{f'- Required within: {days_until_required} days' if days_until_required else ''}

AVAILABLE VENDORS:
{json.dumps(vendor_details, indent=2)}

Analyze and recommend vendors based on:
1. Whether they supply this type of component
2. Lead time vs required delivery date
3. Rating and reliability
4. Price competitiveness (if known)

Respond in JSON format:
{{
    "recommended_vendors": [
        {{
            "vendor_id": 1,
            "vendor_name": "Name",
            "suitability_score": 95,
            "can_deliver_on_time": true,
            "estimated_delivery_date": "YYYY-MM-DD",
            "reasoning": "Why this vendor is recommended"
        }}
    ],
    "best_choice": {{
        "vendor_id": 1,
        "vendor_name": "Name",
        "reasoning": "Why this is the best choice"
    }},
    "alternative_sources": ["Other places to check like Amazon, Newegg, etc."],
    "procurement_advice": "General advice for procuring this item"
}}"""

        try:
            response = self.ai_client.messages.create(
                model="claude-sonnet-4-20250514",
                max_tokens=1024,
                messages=[{"role": "user", "content": prompt}]
            )
            
            response_text = response.content[0].text
            if "```json" in response_text:
                response_text = response_text.split("```json")[1].split("```")[0]
            elif "```" in response_text:
                response_text = response_text.split("```")[1].split("```")[0]
            
            return json.loads(response_text)
            
        except Exception as e:
            return {"error": str(e)}
    
    # ==================== Inventory Request Operations ====================
    
    def create_inventory_request(
        self, 
        data: InventoryRequestCreate, 
        user: User
    ) -> InventoryRequest:
        """Create a new inventory request."""
        # Generate request number
        count = self.db.query(InventoryRequest).count()
        request_number = f"IR-{datetime.now().strftime('%Y%m')}-{count + 1:04d}"
        
        request = InventoryRequest(
            request_number=request_number,
            service_id=data.service_id,
            bom_id=data.bom_id,
            requested_by_id=user.id,
            department_id=user.department_id,
            title=data.title,
            description=data.description,
            justification=data.justification,
            priority=data.priority,
            required_by_date=data.required_by_date,
            status=RequestStatus.DRAFT,
            currency="USD",
            is_deleted=0
        )
        self.db.add(request)
        self.db.flush()
        
        total_amount = Decimal("0")
        
        # Add items
        if data.items:
            for item_data in data.items:
                total_price = None
                if item_data.unit_price and item_data.quantity:
                    total_price = item_data.unit_price * item_data.quantity
                    total_amount += total_price
                
                item = RequestItem(
                    request_id=request.id,
                    component_id=item_data.component_id,
                    vendor_id=item_data.vendor_id,
                    name=item_data.name,
                    description=item_data.description,
                    component_type=ComponentType(item_data.component_type.value) if item_data.component_type else None,
                    category=ComponentCategory(item_data.category.value) if item_data.category else None,
                    quantity=item_data.quantity,
                    unit_price=item_data.unit_price,
                    total_price=total_price,
                    status="pending"
                )
                self.db.add(item)
        
        request.total_amount = total_amount
        self.db.commit()
        self.db.refresh(request)
        return request
    
    def get_inventory_requests(
        self,
        status: str = None,
        user_id: int = None,
        department_id: int = None
    ) -> List[InventoryRequest]:
        """Get inventory requests with filtering."""
        query = self.db.query(InventoryRequest).options(
            joinedload(InventoryRequest.items),
            joinedload(InventoryRequest.approvals),
            joinedload(InventoryRequest.requested_by),
            joinedload(InventoryRequest.department)
        ).filter(InventoryRequest.is_deleted == 0)
        
        if status:
            query = query.filter(InventoryRequest.status == RequestStatus(status))
        if user_id:
            query = query.filter(InventoryRequest.requested_by_id == user_id)
        if department_id:
            query = query.filter(InventoryRequest.department_id == department_id)
        
        return query.order_by(InventoryRequest.created_at.desc()).all()
    
    def get_request_by_id(self, request_id: int) -> InventoryRequest:
        """Get inventory request by ID."""
        request = self.db.query(InventoryRequest).options(
            joinedload(InventoryRequest.items).joinedload(RequestItem.vendor),
            joinedload(InventoryRequest.items).joinedload(RequestItem.component),
            joinedload(InventoryRequest.approvals).joinedload(RequestApproval.approver),
            joinedload(InventoryRequest.requested_by),
            joinedload(InventoryRequest.department),
            joinedload(InventoryRequest.service)
        ).filter(
            InventoryRequest.id == request_id,
            InventoryRequest.is_deleted == 0
        ).first()
        
        if not request:
            raise NotFoundError(f"Request {request_id} not found")
        return request
    
    def submit_for_approval(self, request_id: int, user: User) -> InventoryRequest:
        """Submit request for approval."""
        request = self.get_request_by_id(request_id)
        
        if request.requested_by_id != user.id:
            raise ValidationError("You can only submit your own requests")
        
        if request.status != RequestStatus.DRAFT:
            raise ValidationError("Only draft requests can be submitted")
        
        if not request.items:
            raise ValidationError("Request must have at least one item")
        
        # Create manager approval
        manager_approval = RequestApproval(
            request_id=request_id,
            level=ApprovalLevel.MANAGER,
            approver_id=user.id,  # Should be manager, simplified here
            status=ApprovalStatus.PENDING
        )
        self.db.add(manager_approval)
        
        request.status = RequestStatus.PENDING_APPROVAL
        self.db.commit()
        self.db.refresh(request)
        return request
    
    def process_approval(
        self, 
        request_id: int, 
        approval_id: int,
        action: ApprovalAction,
        user: User
    ) -> InventoryRequest:
        """Process an approval action."""
        request = self.get_request_by_id(request_id)
        
        approval = self.db.query(RequestApproval).filter(
            RequestApproval.id == approval_id,
            RequestApproval.request_id == request_id
        ).first()
        
        if not approval:
            raise NotFoundError("Approval not found")
        
        if approval.status != ApprovalStatus.PENDING:
            raise ValidationError("Approval already processed")
        
        approval.status = ApprovalStatus(action.action.value)
        approval.comments = action.comments
        approval.approved_at = datetime.now(timezone.utc)
        
        if action.action == ApprovalStatus.APPROVED:
            if approval.level == ApprovalLevel.MANAGER:
                request.status = RequestStatus.MANAGER_APPROVED
                # Create dept head approval
                dept_approval = RequestApproval(
                    request_id=request_id,
                    level=ApprovalLevel.DEPARTMENT_HEAD,
                    approver_id=user.id,  # Should be dept head
                    status=ApprovalStatus.PENDING
                )
                self.db.add(dept_approval)
            elif approval.level == ApprovalLevel.DEPARTMENT_HEAD:
                request.status = RequestStatus.DEPT_HEAD_APPROVED
        else:
            request.status = RequestStatus.REJECTED
        
        self.db.commit()
        self.db.refresh(request)
        return request
    
    # ==================== Reports ====================
    
    def generate_inventory_report(self, report_type: str, filters: Dict = None) -> Dict[str, Any]:
        """Generate inventory reports."""
        if report_type == "stock_levels":
            components = self.db.query(Component).filter(Component.is_active == True).all()
            data = {
                "components": [
                    {
                        "id": c.id,
                        "name": c.name,
                        "type": c.component_type.value,
                        "category": c.category.value,
                        "in_stock": c.quantity_in_stock,
                        "minimum": c.minimum_stock_level,
                        "status": "low" if c.quantity_in_stock <= c.minimum_stock_level else "ok"
                    }
                    for c in components
                ],
                "total_components": len(components),
                "low_stock_count": sum(1 for c in components if c.quantity_in_stock <= c.minimum_stock_level)
            }
            summary = f"Total {len(components)} components. {data['low_stock_count']} items low on stock."
            
        elif report_type == "requests_summary":
            requests = self.db.query(InventoryRequest).filter(
                InventoryRequest.is_deleted == 0
            ).all()
            
            status_counts = {}
            for r in requests:
                status = r.status.value
                status_counts[status] = status_counts.get(status, 0) + 1
            
            total_value = sum(float(r.total_amount or 0) for r in requests)
            
            data = {
                "total_requests": len(requests),
                "by_status": status_counts,
                "total_value": total_value
            }
            summary = f"Total {len(requests)} requests worth ${total_value:,.2f}"
            
        elif report_type == "vendor_analysis":
            vendors = self.db.query(Vendor).filter(Vendor.is_active == True).all()
            data = {
                "vendors": [
                    {
                        "id": v.id,
                        "name": v.name,
                        "type": v.vendor_type,
                        "rating": float(v.rating) if v.rating else None,
                        "lead_time": v.lead_time_days
                    }
                    for v in vendors
                ],
                "total_vendors": len(vendors)
            }
            summary = f"Total {len(vendors)} active vendors."
            
        else:
            raise ValidationError(f"Unknown report type: {report_type}")
        
        return {
            "report_type": report_type,
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "data": data,
            "summary": summary
        }
