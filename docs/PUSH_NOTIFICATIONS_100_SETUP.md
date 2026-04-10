# Push Notifications 100% - tec-infoapp-frontend

Esta guía cubre lo que falta para dejar las notificaciones push realmente funcionales en:

- Android nativo con Capacitor + FCM
- iOS nativo con Capacitor + APNs/FCM
- Web Push / PWA con VAPID

El código del proyecto ya está preparado. Lo que falta ahora es colocar archivos reales de Firebase, activar capabilities de iOS y configurar variables en frontend/backend.

## 1. Datos del proyecto

- App ID / Package / Bundle ID: `com.app.tec.gt`
- Android Firebase file esperado: [`android/app/google-services.json`](/tec-infoapp-frontend/android/app/google-services.json)
- iOS Firebase file esperado: [`ios/App/App/GoogleService-Info.plist`](/tec-infoapp-frontend/ios/App/App/GoogleService-Info.plist)
- Frontend env example: [`/tec-infoapp-frontend/.env.example`](/tec-infoapp-frontend/.env.example)

## 2. Firebase - crear apps Android e iOS

### 2.1 Crear o abrir tu proyecto Firebase

1. Ve a [Firebase Console](https://console.firebase.google.com/).
2. Crea un proyecto nuevo o usa uno existente.
3. Entra a `Project settings`.

### 2.2 Crear la app Android

1. Click en `Add app` y elige Android.
2. En `Android package name` escribe exactamente:

```text
com.app.tec.gt
```

3. Guarda y descarga `google-services.json`.
4. Cópialo en:

```text
android/app/google-services.json
```

Puedes usar esta plantilla como referencia:

- [`android/app/google-services.json.example`](/tec-infoapp-frontend/android/app/google-services.json.example)

### 2.3 Crear la app iOS

1. Click en `Add app` y elige iOS.
2. En `Apple bundle ID` escribe exactamente:

```text
com.app.tec.gt
```

3. Guarda y descarga `GoogleService-Info.plist`.
4. Cópialo en:

```text
ios/App/App/GoogleService-Info.plist
```

Puedes usar esta plantilla como referencia:

- [`ios/App/App/GoogleService-Info.plist.example`](/tec-infoapp-frontend/ios/App/App/GoogleService-Info.plist.example)

## 3. Frontend env

Edita:

- [`/tec-infoapp-frontend/.env`](/tec-infoapp-frontend/.env)

Variables relevantes:

```env
VITE_NATIVE_PUSH_NOTIFICATIONS=true
VITE_NATIVE_CAMERA=true
VITE_NATIVE_GEOLOCATION=true
VITE_VAPID_PUBLIC_KEY="TU_CLAVE_PUBLICA_VAPID"
```

Notas:

- `VITE_NATIVE_PUSH_NOTIFICATIONS=true` debe quedar activo.
- `VITE_VAPID_PUBLIC_KEY` solo aplica a Web Push/PWA.
- Android/iOS nativo no usan variables Vite para Firebase. Usan los archivos descargados desde Firebase.

## 4. Backend env necesario

El backend que envía las notificaciones debe tener variables reales para FCM y Web Push.

Ejemplo:

```env
FCM_PROJECT_ID=tu-project-id
FCM_CLIENT_EMAIL=firebase-adminsdk-xxxx@tu-project.iam.gserviceaccount.com
FCM_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FCM_ANDROID_CHANNEL_ID=default

VAPID_PUBLIC_KEY=tu_vapid_public_key
VAPID_PRIVATE_KEY=tu_vapid_private_key
VAPID_SUBJECT=mailto:admin@tudominio.com
```

Cómo sacar estos datos:

### 4.1 Firebase Admin

1. Firebase Console.
2. `Project settings`.
3. `Service accounts`.
4. `Generate new private key`.
5. Descarga el JSON.
6. De ese JSON salen:

- `project_id` -> `FCM_PROJECT_ID`
- `client_email` -> `FCM_CLIENT_EMAIL`
- `private_key` -> `FCM_PRIVATE_KEY`

### 4.2 VAPID

Genera las claves en el backend:

```bash
pnpm dlx web-push generate-vapid-keys
```

Te va a devolver:

- Public Key -> `VAPID_PUBLIC_KEY`
- Private Key -> `VAPID_PRIVATE_KEY`

La pública también debes copiarla al frontend:

```env
VITE_VAPID_PUBLIC_KEY="TU_CLAVE_PUBLICA_VAPID"
```

## 5. Android - dejarlo funcional

Ya está preparado en el repo:

- `google-services` plugin condicional en [`android/app/build.gradle`](/tec-infoapp-frontend/android/app/build.gradle)
- `POST_NOTIFICATIONS` en [`AndroidManifest.xml`](/tec-infoapp-frontend/android/app/src/main/AndroidManifest.xml)

Lo que debes hacer:

1. Colocar `android/app/google-services.json`.
2. Ejecutar:

```bash
pnpm build
pnpm exec cap sync android
```

3. Abrir Android Studio:

```bash
pnpm exec cap open android
```

4. Probar en dispositivo físico Android.
5. Verificar que al iniciar sesión o registrar push se guarde el token en `push-tokens` del backend.

## 6. iOS - dejarlo funcional

Ya está preparado en el repo:

- `remote-notification` en [`ios/App/App/Info.plist`](/tec-infoapp-frontend/ios/App/App/Info.plist)
- entitlements en [`ios/App/App/App.entitlements`](/tec-infoapp-frontend/ios/App/App/App.entitlements)
- `CODE_SIGN_ENTITLEMENTS` en [`ios/App/App.xcodeproj/project.pbxproj`](/tec-infoapp-frontend/ios/App/App.xcodeproj/project.pbxproj)

Lo que debes hacer:

1. Colocar `ios/App/App/GoogleService-Info.plist`.
2. Abrir Xcode:

```bash
pnpm exec cap open ios
```

3. En el target `App` abre `Signing & Capabilities`.
4. Agrega `Push Notifications`.
5. Agrega `Background Modes`.
6. Dentro de `Background Modes`, marca `Remote notifications`.
7. Confirma que el Bundle ID sea:

```text
com.app.tec.gt
```

8. En Apple Developer crea o usa una `APNs Authentication Key (.p8)`.
9. En Firebase Console -> `Project settings` -> `Cloud Messaging` -> sección iOS, sube esa APNs Key.
10. Compila y prueba en iPhone físico. En simulador no sirve.

## 7. Validación final

Corre:

```bash
pnpm build
pnpm exec cap sync android
pnpm exec cap sync ios
```

Checklist:

- [ ] Existe `android/app/google-services.json`
- [ ] Existe `ios/App/App/GoogleService-Info.plist`
- [ ] `.env` tiene `VITE_NATIVE_PUSH_NOTIFICATIONS=true`
- [ ] `.env` tiene `VITE_VAPID_PUBLIC_KEY` si usarás Web Push/PWA
- [ ] Backend tiene `FCM_*`
- [ ] Backend tiene `VAPID_*`
- [ ] Firebase iOS tiene APNs Key cargada
- [ ] Xcode tiene `Push Notifications`
- [ ] Xcode tiene `Background Modes > Remote notifications`
- [ ] Android físico registra token
- [ ] iPhone físico registra token
- [ ] El backend guarda el token en `push-tokens`

## 8. Resultado esperado

Cuando todo esté bien:

- Android recibe token FCM
- iOS recibe token APNs/FCM
- El frontend registra el token en backend
- El backend puede enviar push a ese token
- La PWA puede suscribirse a Web Push si `VITE_VAPID_PUBLIC_KEY` está configurada

