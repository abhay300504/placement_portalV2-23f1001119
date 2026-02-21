from celery_worker import celery
from celery.schedules import crontab
from models import Application, PlacementDrive, StudentProfile, User
from extensions import mail
from flask_mail import Message
from datetime import datetime, timedelta

@celery.task
def send_deadline_reminders():
    """Daily task: Send reminders to students about drives closing in 3 days"""

    tomorrow = datetime.utcnow() + timedelta(days=3)
    start = tomorrow.replace(hour=0, minute=0, second=0)
    end   = tomorrow.replace(hour=23, minute=59, second=59)

    # Find drives with deadline in next 3 days
    upcoming_drives = PlacementDrive.query.filter(
        PlacementDrive.status == 'approved',
        PlacementDrive.application_deadline >= start,
        PlacementDrive.application_deadline <= end
    ).all()

    if not upcoming_drives:
        return 'No upcoming deadlines'

    # Get all active students
    students = StudentProfile.query.join(User).filter(User.is_active == True).all()

    sent_count = 0
    for student in students:
        if not student.user.email:
            continue

        # Check which drives they haven't applied to yet
        applied_drive_ids = [a.drive_id for a in student.applications]
        remind_drives = [d for d in upcoming_drives if d.id not in applied_drive_ids]

        if not remind_drives:
            continue

        drive_list = '\n'.join([
            f"- {d.job_title} at {d.company.company_name} (Deadline: {d.application_deadline.strftime('%Y-%m-%d')})"
            for d in remind_drives
        ])

        msg = Message(
            subject='⏰ Placement Drive Deadline Reminder',
            recipients=[student.user.email],
            body=f'''Hi {student.name},

The following placement drives are closing soon! Don't miss out:

{drive_list}

Login to the Placement Portal to apply now.

Best,
Placement Cell'''
        )
        mail.send(msg)
        sent_count += 1

    return f'Reminders sent to {sent_count} students'
