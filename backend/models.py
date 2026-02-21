from extensions import db
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime

# ─────────────────────────────────────────
# UNIFIED USER MODEL
# ─────────────────────────────────────────
class User(db.Model):
    __tablename__ = 'users'

    id            = db.Column(db.Integer, primary_key=True)
    email         = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    role          = db.Column(db.String(20), nullable=False)  # 'admin', 'company', 'student'
    is_active     = db.Column(db.Boolean, default=True)
    created_at    = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    student_profile = db.relationship('StudentProfile', backref='user', uselist=False)
    company_profile = db.relationship('CompanyProfile', backref='user', uselist=False)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {
            'id': self.id,
            'email': self.email,
            'role': self.role,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat()
        }


# ─────────────────────────────────────────
# STUDENT PROFILE
# ─────────────────────────────────────────
class StudentProfile(db.Model):
    __tablename__ = 'student_profiles'

    id          = db.Column(db.Integer, primary_key=True)
    user_id     = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    name        = db.Column(db.String(100), nullable=False)
    roll_number = db.Column(db.String(50), unique=True)
    branch      = db.Column(db.String(100))
    year        = db.Column(db.Integer)
    cgpa        = db.Column(db.Float)
    phone       = db.Column(db.String(20))
    resume_path = db.Column(db.String(256))  # file path to uploaded resume
    is_blacklisted = db.Column(db.Boolean, default=False)
    created_at  = db.Column(db.DateTime, default=datetime.utcnow)

    applications = db.relationship('Application', backref='student', lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'name': self.name,
            'email': self.user.email,
            'roll_number': self.roll_number,
            'branch': self.branch,
            'year': self.year,
            'cgpa': self.cgpa,
            'phone': self.phone,
            'resume_path': self.resume_path,
            'is_blacklisted': self.is_blacklisted
        }


# ─────────────────────────────────────────
# COMPANY PROFILE
# ─────────────────────────────────────────
class CompanyProfile(db.Model):
    __tablename__ = 'company_profiles'

    id              = db.Column(db.Integer, primary_key=True)
    user_id         = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    company_name    = db.Column(db.String(150), nullable=False)
    hr_contact_name = db.Column(db.String(100))
    hr_phone        = db.Column(db.String(20))
    website         = db.Column(db.String(200))
    description     = db.Column(db.Text)
    approval_status = db.Column(db.String(20), default='pending')  # pending/approved/rejected
    is_blacklisted  = db.Column(db.Boolean, default=False)
    created_at      = db.Column(db.DateTime, default=datetime.utcnow)

    drives = db.relationship('PlacementDrive', backref='company', lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'company_name': self.company_name,
            'hr_contact_name': self.hr_contact_name,
            'hr_phone': self.hr_phone,
            'website': self.website,
            'description': self.description,
            'approval_status': self.approval_status,
            'is_blacklisted': self.is_blacklisted,
            'email': self.user.email
        }


# ─────────────────────────────────────────
# PLACEMENT DRIVE
# ─────────────────────────────────────────
class PlacementDrive(db.Model):
    __tablename__ = 'placement_drives'

    id                  = db.Column(db.Integer, primary_key=True)
    company_id          = db.Column(db.Integer, db.ForeignKey('company_profiles.id'), nullable=False)
    job_title           = db.Column(db.String(150), nullable=False)
    job_description     = db.Column(db.Text)
    eligibility_branch  = db.Column(db.String(200))   # e.g. "CSE,ECE,IT" (comma separated)
    eligibility_cgpa    = db.Column(db.Float, default=0.0)
    eligibility_year    = db.Column(db.Integer)        # e.g. 4 (final year)
    application_deadline = db.Column(db.DateTime)
    package_lpa         = db.Column(db.Float)          # salary in LPA
    location            = db.Column(db.String(150))
    status              = db.Column(db.String(20), default='pending')  # pending/approved/closed
    created_at          = db.Column(db.DateTime, default=datetime.utcnow)

    applications = db.relationship('Application', backref='drive', lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'company_id': self.company_id,
            'company_name': self.company.company_name,
            'job_title': self.job_title,
            'job_description': self.job_description,
            'eligibility_branch': self.eligibility_branch,
            'eligibility_cgpa': self.eligibility_cgpa,
            'eligibility_year': self.eligibility_year,
            'application_deadline': self.application_deadline.isoformat() if self.application_deadline else None,
            'package_lpa': self.package_lpa,
            'location': self.location,
            'status': self.status,
            'created_at': self.created_at.isoformat()
        }


# ─────────────────────────────────────────
# APPLICATION
# ─────────────────────────────────────────
class Application(db.Model):
    __tablename__ = 'applications'

    id               = db.Column(db.Integer, primary_key=True)
    student_id       = db.Column(db.Integer, db.ForeignKey('student_profiles.id'), nullable=False)
    drive_id         = db.Column(db.Integer, db.ForeignKey('placement_drives.id'), nullable=False)
    application_date = db.Column(db.DateTime, default=datetime.utcnow)
    status           = db.Column(db.String(20), default='applied')  # applied/shortlisted/selected/rejected

    # Prevent duplicate applications
    __table_args__ = (
        db.UniqueConstraint('student_id', 'drive_id', name='unique_application'),
    )

    def to_dict(self):
        return {
            'id': self.id,
            'student_id': self.student_id,
            'student_name': self.student.name,
            'drive_id': self.drive_id,
            'job_title': self.drive.job_title,
            'company_name': self.drive.company.company_name,
            'application_date': self.application_date.isoformat(),
            'status': self.status
        }