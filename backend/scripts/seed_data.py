"""
Tessolve Executive Portal - Database Seed Script
Creates roles, permissions, and initial seed users.

Usage:
    python -m scripts.seed_data
    
Or from backend directory:
    python scripts/seed_data.py
"""

import sys
import os

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from app.db.session import SessionLocal, engine
from app.models.base import Base
from app.models.user import User, Role, Permission, role_permissions
from app.models.user_settings import UserSettings
from app.models.master_data import Department, Sector, Technology, EngagementModel, ServiceCategory
from app.models.audit import AuditLog
from app.core.security import PasswordHandler
from app.core.permissions import ROLE_PERMISSIONS, Permissions


def create_tables(db: Session) -> None:
    """Create all database tables."""
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("✓ Tables created")


def seed_permissions(db: Session) -> dict:
    """Create all permission records."""
    print("Seeding permissions...")
    
    permission_definitions = [
        # Services
        (Permissions.SERVICES_READ, "Read Services", "services", "View services and projects"),
        (Permissions.SERVICES_WRITE, "Write Services", "services", "Create and edit services"),
        (Permissions.SERVICES_DELETE, "Delete Services", "services", "Delete services"),
        # Products
        (Permissions.PRODUCTS_READ, "Read Products", "products", "View products"),
        (Permissions.PRODUCTS_WRITE, "Write Products", "products", "Create and edit products"),
        (Permissions.PRODUCTS_DELETE, "Delete Products", "products", "Delete products"),
        # CTI
        (Permissions.CTI_READ, "Read CTI Data", "cti", "View customer/technical intelligence"),
        (Permissions.CTI_WRITE, "Write CTI Data", "cti", "Create and edit CTI data"),
        (Permissions.CTI_PRODUCTS_READ, "Read CTI Products", "cti", "View product CTI data"),
        (Permissions.CTI_PRODUCTS_WRITE, "Write CTI Products", "cti", "Edit product CTI data"),
        # Analytics
        (Permissions.ANALYTICS_READ, "Read Analytics", "analytics", "View basic analytics"),
        (Permissions.ANALYTICS_EXECUTIVE, "Executive Insights", "analytics", "View executive insights"),
        # Admin
        (Permissions.ADMIN_USERS, "Manage Users", "admin", "Create, edit, delete users"),
        (Permissions.ADMIN_ROLES, "Manage Roles", "admin", "Manage roles and permissions"),
        (Permissions.ADMIN_MASTER_DATA, "Manage Master Data", "admin", "Manage sectors, technologies, etc."),
        (Permissions.ADMIN_AUDIT_LOGS, "View Audit Logs", "admin", "View system audit logs"),
    ]
    
    permissions = {}
    for code, name, module, description in permission_definitions:
        # Check if permission exists
        perm = db.query(Permission).filter(Permission.code == code).first()
        if not perm:
            perm = Permission(
                code=code,
                name=name,
                module=module,
                description=description,
            )
            db.add(perm)
        permissions[code] = perm
    
    db.commit()
    print(f"✓ {len(permissions)} permissions created/verified")
    return permissions


def seed_roles(db: Session, permissions: dict) -> dict:
    """Create roles and assign permissions."""
    print("Seeding roles...")
    
    role_definitions = [
        ("admin", "Administrator", "Full system access with all administrative capabilities"),
        ("manager", "Manager", "Strategic access including CTI data and executive insights"),
        ("engineer", "Engineer", "Operational access to services and products"),
    ]
    
    roles = {}
    for name, display_name, description in role_definitions:
        # Check if role exists
        role = db.query(Role).filter(Role.name == name).first()
        if not role:
            role = Role(
                name=name,
                display_name=display_name,
                description=description,
                is_active=True,
            )
            db.add(role)
            db.flush()  # Get the ID
        
        # Assign permissions based on ROLE_PERMISSIONS mapping
        role_perms = ROLE_PERMISSIONS.get(name, [])
        for perm_code in role_perms:
            if perm_code in permissions:
                perm = permissions[perm_code]
                if perm not in role.permissions:
                    role.permissions.append(perm)
        
        roles[name] = role
    
    db.commit()
    print(f"✓ {len(roles)} roles created/verified with permissions")
    return roles


def seed_departments(db: Session) -> dict:
    """Create initial departments."""
    print("Seeding departments...")
    
    department_definitions = [
        ("Engineering", "ENG"),
        ("Product Management", "PM"),
        ("Consulting", "CON"),
        ("Sales", "SAL"),
        ("Operations", "OPS"),
    ]
    
    departments = {}
    for name, code in department_definitions:
        dept = db.query(Department).filter(Department.code == code).first()
        if not dept:
            dept = Department(name=name, code=code, is_active=True)
            db.add(dept)
        departments[code] = dept
    
    db.commit()
    print(f"✓ {len(departments)} departments created/verified")
    return departments


def seed_master_data(db: Session) -> None:
    """Create initial master data entries."""
    print("Seeding master data...")
    
    # Sectors
    sectors = ["Technology", "Healthcare", "Finance", "Manufacturing", "Retail", "Energy"]
    for name in sectors:
        if not db.query(Sector).filter(Sector.name == name).first():
            db.add(Sector(name=name, is_active=True))
    
    # Technologies
    technologies = [
        ("React", "Frontend"),
        ("Angular", "Frontend"),
        ("Vue.js", "Frontend"),
        ("Python", "Backend"),
        ("Node.js", "Backend"),
        ("Java", "Backend"),
        ("PostgreSQL", "Database"),
        ("MongoDB", "Database"),
        ("AWS", "Cloud"),
        ("Azure", "Cloud"),
        ("Docker", "DevOps"),
        ("Kubernetes", "DevOps"),
        ("TensorFlow", "AI/ML"),
        ("PyTorch", "AI/ML"),
    ]
    for name, category in technologies:
        if not db.query(Technology).filter(Technology.name == name).first():
            db.add(Technology(name=name, category=category, is_active=True))
    
    # Engagement Models
    engagement_models = [
        ("Fixed Price", "milestone", "Fixed cost for defined scope"),
        ("Time & Materials", "hourly", "Billed based on time spent"),
        ("Retainer", "monthly", "Monthly retainer fee"),
        ("Managed Services", "monthly", "Ongoing managed service contract"),
        ("COE", "monthly", "Center of Excellence engagement"),
    ]
    for name, billing, desc in engagement_models:
        if not db.query(EngagementModel).filter(EngagementModel.name == name).first():
            db.add(EngagementModel(name=name, billing_type=billing, description=desc, is_active=True))
    
    # Service Categories
    categories = [
        ("Consulting", "Strategic and technical consulting services"),
        ("Development", "Custom software development"),
        ("Managed Services", "Ongoing operational support"),
        ("Training", "Technical training and workshops"),
        ("Support", "Technical support services"),
        ("COE", "Center of Excellence services"),
    ]
    for name, desc in categories:
        if not db.query(ServiceCategory).filter(ServiceCategory.name == name).first():
            db.add(ServiceCategory(name=name, description=desc, is_active=True))
    
    db.commit()
    print("✓ Master data seeded")


def seed_users(db: Session, roles: dict, departments: dict) -> dict:
    """Create seed users: Admin, Manager, Engineer."""
    print("Seeding users...")
    
    users_to_create = [
        {
            "username": "admin",
            "email": "admin@tessolve.com",
            "password": "Admin@123!",
            "full_name": "System Administrator",
            "role": "admin",
            "department": "OPS",
        },
        {
            "username": "manager",
            "email": "manager@tessolve.com",
            "password": "Manager@123!",
            "full_name": "Aswanth Raja",
            "role": "manager",
            "department": "PM",
        },
        {
            "username": "engineer",
            "email": "engineer@tessolve.com",
            "password": "Engineer@123!",
            "full_name": "Software Engineer",
            "role": "engineer",
            "department": "ENG",
        },
    ]
    
    created_users = {}
    created_count = 0
    for user_data in users_to_create:
        # Check if user exists
        existing = db.query(User).filter(
            (User.username == user_data["username"]) | 
            (User.email == user_data["email"])
        ).first()
        
        if existing:
            print(f"  → User '{user_data['username']}' already exists, skipping")
            created_users[user_data["username"]] = existing
            continue
        
        user = User(
            username=user_data["username"],
            email=user_data["email"],
            password_hash=PasswordHandler.hash(user_data["password"]),
            full_name=user_data["full_name"],
            role_id=roles[user_data["role"]].id,
            department_id=departments.get(user_data["department"], departments["ENG"]).id if user_data.get("department") else None,
            is_active=True,
            is_locked=False,
            failed_attempts=0,
        )
        db.add(user)
        created_users[user_data["username"]] = user
        created_count += 1
        print(f"  → Created user: {user_data['username']} ({user_data['role']})")
    
    db.commit()
    print(f"✓ {created_count} users created")
    return created_users


def seed_services(db: Session, users: dict) -> None:
    """Seed sample services for testing."""
    print("Seeding services...")
    
    from app.models.service import Service, ServiceStatus, CustomerType
    
    # Check if services already exist
    if db.query(Service).first():
        print("  - Services already exist, skipping...")
        return
    
    # Get manager user
    manager = users.get("manager") or db.query(User).filter(User.username == "manager").first()
    if not manager:
        print("  - No manager user found, skipping services...")
        return
    
    # Get some master data
    from app.models.master_data import Sector, Technology, EngagementModel, ServiceCategory, Department
    
    sector = db.query(Sector).first()
    tech = db.query(Technology).first()
    engagement = db.query(EngagementModel).first()
    category = db.query(ServiceCategory).first()
    department = db.query(Department).first()
    
    services_data = [
        {
            "name": "Semiconductor Testing Platform",
            "description": "End-to-end semiconductor chip testing solution with automated test generation and analysis",
            "customer_name": "Intel Corporation",
            "customer_type": CustomerType.EXISTING,
            "customer_email": "procurement@intel.com",
            "status": ServiceStatus.ACTIVE,
            "contract_value": 450000.00,
            "resource_count": 12,
        },
        {
            "name": "IoT Device Validation Suite",
            "description": "Comprehensive validation framework for IoT devices including connectivity, power, and security testing",
            "customer_name": "Samsung Electronics",
            "customer_type": CustomerType.NEW,
            "customer_email": "iot-team@samsung.com",
            "status": ServiceStatus.ACTIVE,
            "contract_value": 320000.00,
            "resource_count": 8,
        },
        {
            "name": "Automotive ECU Testing",
            "description": "Electronic Control Unit testing services for automotive applications including safety validation",
            "customer_name": "Bosch",
            "customer_type": CustomerType.EXISTING,
            "customer_email": "automotive@bosch.com",
            "status": ServiceStatus.IN_PROGRESS,
            "contract_value": 580000.00,
            "resource_count": 15,
        },
        {
            "name": "5G Module Certification",
            "description": "Testing and certification services for 5G communication modules",
            "customer_name": "Qualcomm",
            "customer_type": CustomerType.NEW,
            "customer_email": "certification@qualcomm.com",
            "status": ServiceStatus.DRAFT,
            "contract_value": 275000.00,
            "resource_count": 6,
        },
        {
            "name": "FPGA Design Verification",
            "description": "FPGA design verification and validation services with formal verification support",
            "customer_name": "AMD Xilinx",
            "customer_type": CustomerType.EXISTING,
            "customer_email": "fpga-services@amd.com",
            "status": ServiceStatus.ACTIVE,
            "contract_value": 390000.00,
            "resource_count": 10,
        },
        {
            "name": "Power Management IC Testing",
            "description": "Comprehensive testing for power management integrated circuits",
            "customer_name": "Texas Instruments",
            "customer_type": CustomerType.NEW,
            "customer_email": "pmic@ti.com",
            "status": ServiceStatus.PENDING,
            "contract_value": 210000.00,
            "resource_count": 5,
        },
    ]
    
    for svc_data in services_data:
        service = Service(
            name=svc_data["name"],
            description=svc_data["description"],
            customer_name=svc_data["customer_name"],
            customer_type=svc_data["customer_type"],
            customer_email=svc_data["customer_email"],
            status=svc_data["status"],
            contract_value=svc_data["contract_value"],
            resource_count=svc_data["resource_count"],
            manager_id=manager.id,
            sector_id=sector.id if sector else None,
            engagement_model_id=engagement.id if engagement else None,
            service_category_id=category.id if category else None,
            department_id=department.id if department else None,
            is_deleted=0,
        )
        db.add(service)
    
    db.commit()
    print(f"✓ {len(services_data)} services created")


def print_credentials():
    """Print the seed user credentials."""
    print("\n" + "=" * 60)
    print("SEED USER CREDENTIALS")
    print("=" * 60)
    print("""
┌─────────────┬─────────────────────────┬───────────────┬──────────┐
│ Role        │ Email                   │ Username      │ Password │
├─────────────┼─────────────────────────┼───────────────┼──────────┤
│ Admin       │ admin@tessolve.com      │ admin         │ Admin@123!    │
│ Manager     │ manager@tessolve.com    │ manager       │ Manager@123!  │
│ Engineer    │ engineer@tessolve.com   │ engineer      │ Engineer@123! │
└─────────────┴─────────────────────────┴───────────────┴──────────┘
    """)
    print("⚠️  IMPORTANT: Change these passwords in production!")
    print("=" * 60 + "\n")


def main():
    """Run the seed script."""
    print("\n" + "=" * 60)
    print("TESSOLVE EXECUTIVE PORTAL - DATABASE SEED")
    print("=" * 60 + "\n")
    
    db = SessionLocal()
    
    try:
        # Create tables
        create_tables(db)
        
        # Seed data in order
        permissions = seed_permissions(db)
        roles = seed_roles(db, permissions)
        departments = seed_departments(db)
        seed_master_data(db)
        users = seed_users(db, roles, departments)
        seed_services(db, users)
        seed_inventory_data(db)
        
        print("\n✅ Database seeding completed successfully!")
        print_credentials()
        
    except Exception as e:
        print(f"\n❌ Error during seeding: {e}")
        db.rollback()
        raise
    finally:
        db.close()

def seed_inventory_data(db: Session) -> None:
    """Seed sample inventory data - vendors and components."""
    print("Seeding inventory data...")
    
    from app.models.inventory import Vendor, Component, ComponentType, ComponentCategory
    
    # Check if already seeded
    if db.query(Vendor).first():
        print("  - Inventory data already exists, skipping...")
        return
    
    # Create vendors
    vendors_data = [
        {
            "name": "Dell Technologies",
            "code": "DELL",
            "contact_person": "Sales Team",
            "email": "sales@dell.com",
            "website": "https://www.dell.com",
            "vendor_type": "hardware",
            "lead_time_days": 7,
            "rating": 4.5,
            "categories": ["server", "workstation", "storage", "peripheral"]
        },
        {
            "name": "HP Enterprise",
            "code": "HPE",
            "contact_person": "Enterprise Sales",
            "email": "sales@hpe.com",
            "website": "https://www.hpe.com",
            "vendor_type": "hardware",
            "lead_time_days": 10,
            "rating": 4.3,
            "categories": ["server", "networking", "storage"]
        },
        {
            "name": "Microsoft",
            "code": "MSFT",
            "contact_person": "Licensing Team",
            "email": "licensing@microsoft.com",
            "website": "https://www.microsoft.com",
            "vendor_type": "software",
            "lead_time_days": 1,
            "rating": 4.7,
            "categories": ["operating_system", "development_tool", "cloud_service"]
        },
        {
            "name": "Amazon Web Services",
            "code": "AWS",
            "contact_person": "Cloud Sales",
            "email": "sales@aws.amazon.com",
            "website": "https://aws.amazon.com",
            "vendor_type": "software",
            "lead_time_days": 1,
            "rating": 4.6,
            "categories": ["cloud_service", "database", "security"]
        },
        {
            "name": "Cisco Systems",
            "code": "CISCO",
            "contact_person": "Network Sales",
            "email": "sales@cisco.com",
            "website": "https://www.cisco.com",
            "vendor_type": "hardware",
            "lead_time_days": 14,
            "rating": 4.4,
            "categories": ["networking", "security"]
        },
        {
            "name": "JetBrains",
            "code": "JETB",
            "contact_person": "Sales",
            "email": "sales@jetbrains.com",
            "website": "https://www.jetbrains.com",
            "vendor_type": "software",
            "lead_time_days": 1,
            "rating": 4.8,
            "categories": ["development_tool"]
        },
    ]
    
    for v_data in vendors_data:
        vendor = Vendor(**v_data)
        db.add(vendor)
    
    # Create some sample components
    components_data = [
        {
            "name": "Dell PowerEdge R750",
            "sku": "PE-R750-01",
            "component_type": ComponentType.HARDWARE,
            "category": ComponentCategory.SERVER,
            "description": "Enterprise-grade rack server",
            "quantity_in_stock": 5,
            "minimum_stock_level": 2,
            "unit_price": 8500.00
        },
        {
            "name": "Dell Precision 5570",
            "sku": "DP-5570-01",
            "component_type": ComponentType.HARDWARE,
            "category": ComponentCategory.WORKSTATION,
            "description": "High-performance developer workstation",
            "quantity_in_stock": 10,
            "minimum_stock_level": 5,
            "unit_price": 2800.00
        },
        {
            "name": "Windows 11 Pro License",
            "sku": "WIN11-PRO",
            "component_type": ComponentType.LICENSE,
            "category": ComponentCategory.OPERATING_SYSTEM,
            "description": "Windows 11 Professional OEM License",
            "quantity_in_stock": 50,
            "minimum_stock_level": 10,
            "unit_price": 199.00,
            "license_type": "perpetual"
        },
        {
            "name": "IntelliJ IDEA Ultimate",
            "sku": "JB-IDEA-ULT",
            "component_type": ComponentType.LICENSE,
            "category": ComponentCategory.DEVELOPMENT_TOOL,
            "description": "JetBrains IntelliJ IDEA Ultimate annual subscription",
            "quantity_in_stock": 25,
            "minimum_stock_level": 5,
            "unit_price": 599.00,
            "license_type": "subscription"
        },
        {
            "name": "Cisco Catalyst 9200",
            "sku": "CISCO-C9200",
            "component_type": ComponentType.HARDWARE,
            "category": ComponentCategory.NETWORKING,
            "description": "Managed network switch 24-port",
            "quantity_in_stock": 3,
            "minimum_stock_level": 2,
            "unit_price": 3500.00
        },
    ]
    
    for c_data in components_data:
        component = Component(**c_data)
        db.add(component)
    
    db.commit()
    print(f"  - Created {len(vendors_data)} vendors")
    print(f"  - Created {len(components_data)} components")
    print("✓ Inventory data seeded")


if __name__ == "__main__":
    main()
