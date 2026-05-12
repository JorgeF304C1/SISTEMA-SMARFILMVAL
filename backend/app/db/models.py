from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base

class SystemSettings(Base):
    __tablename__ = "system_settings"
    id = Column(Integer, primary_key=True, index=True)
    default_price_per_ml = Column(Float, default=200.0)
    default_roll_width = Column(Float, default=1.5)
    default_base_cost_per_sqm = Column(Float, default=70.0)
    default_labor_cost_per_sqm = Column(Float, default=15.0)
    delivery_note_warranty_months = Column(Integer, default=3)

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    password_hash = Column(String)
    role = Column(String, default="Admin")
    created_at = Column(DateTime(timezone=True), server_default=func.now())



class RollInventory(Base):
    __tablename__ = "roll_inventory"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String) # Ej. "Bobina Principal 50m"
    roll_width = Column(Float, default=1.5)
    total_meters = Column(Float)
    current_meters = Column(Float)
    status = Column(String, default="Activo") # Activo, Agotado
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class GlobalExpense(Base):
    __tablename__ = "global_expenses"
    id = Column(Integer, primary_key=True, index=True)
    description = Column(String)
    amount = Column(Float)
    category = Column(String, default="Marketing") # Marketing, Operativo, etc.
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Project(Base):
    __tablename__ = "projects"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    client_name_direct = Column(String, nullable=True)
    client_ci_rif_direct = Column(String, nullable=True)
    client_phone_direct = Column(String, nullable=True)
    client_email_direct = Column(String, nullable=True)
    client_address_direct = Column(String, nullable=True)
    
    status = Column(String, default="Prospecto")
    
    # Financial & Meds
    price_per_ml = Column(Float, default=200.0)
    roll_width = Column(Float, default=1.5)
    module_cost = Column(Float, default=0.0)
    base_cost_per_sqm = Column(Float, default=70.0)
    labor_cost_per_sqm = Column(Float, default=15.0)
    pricing_mode = Column(String, default="ml")
    installation_date = Column(String, nullable=True) # YYYY-MM-DD
    approved_date = Column(String, nullable=True) # YYYY-MM-DD
    completed_date = Column(String, nullable=True) # YYYY-MM-DD
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    areas = relationship("ProjectArea", back_populates="project", cascade="all, delete-orphan")
    expenses = relationship("ProjectExpense", back_populates="project", cascade="all, delete-orphan")
    photos = relationship("ProjectPhoto", back_populates="project", cascade="all, delete-orphan")

class ProjectArea(Base):
    __tablename__ = "project_areas"
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"))
    name = Column(String, nullable=True)
    width = Column(Float)
    height = Column(Float)
    
    project = relationship("Project", back_populates="areas")
    
    @property
    def area(self):
        return self.width * self.height

class ProjectExpense(Base):
    __tablename__ = "project_expenses"
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"))
    description = Column(String)
    amount = Column(Float)
    expense_type = Column(String, default="Variable")
    is_nullified = Column(Boolean, default=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    project = relationship("Project", back_populates="expenses")

class ProjectPhoto(Base):
    __tablename__ = "project_photos"
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"))
    file_path = Column(String) # usually points to uploaded image
    category = Column(String, default="General") # Antes, Durante, Después
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())
    
    project = relationship("Project", back_populates="photos")
