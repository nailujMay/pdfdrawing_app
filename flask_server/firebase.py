import firebase_admin
from firebase_admin import credentials, storage

cred = credentials.Certificate("firebasePy\pdfdraw-30ab9-firebase-adminsdk-gxaom-069fc16c41.json")
firebase_admin.initialize_app(cred, {'storageBucket': 'gs://pdfdraw-30ab9.appspot.com'})

bucket = storage.bucket()

