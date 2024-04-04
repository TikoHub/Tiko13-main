from django.apps import AppConfig

class StoreConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'store'

    def ready(self):
        import store.signals
        # Import the signals module to ensure signal handlers are registered
        from . import signals  # This line is important!
