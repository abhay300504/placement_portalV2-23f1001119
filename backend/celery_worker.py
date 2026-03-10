from app import create_app
from extensions import make_celery

flask_app = create_app()
celery = make_celery(flask_app)

# Scheduled Tasks (Beat Schedule)
from celery.schedules import crontab

celery.conf.beat_schedule = {
    # Daily reminder at 9:00 AM
    'daily-deadline-reminders': {
        'task': 'tasks.reminders.send_deadline_reminders',
        'schedule': crontab(hour=9, minute=0),
    },
    # Monthly report on 1st of every month at 8:00 AM
    'monthly-activity-report': {
        'task': 'tasks.monthly_report.send_monthly_report',
        'schedule': crontab(day_of_month=1, hour=8, minute=0),
    },
}

celery.conf.timezone = 'Asia/Kolkata'