import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const retentionItems = [
  'Datos de autenticación y perfil asociados a la cuenta.',
  'Preferencias, tokens de notificación y accesos vinculados al usuario.',
  'Registros visibles dentro de la experiencia del usuario en la aplicación, cuando aplique.',
];

const retainedItems = [
  'Registros mínimos necesarios para auditoría, seguridad, prevención de fraude o cumplimiento normativo.',
  'Bitácoras técnicas y trazas operativas que deban conservarse temporalmente por obligaciones legales u operativas.',
  'Información que ya haya sido anonimizada, agregada o desvinculada de la cuenta personal.',
];

export default function AccountDeletionInfo() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-5xl py-12 space-y-8">
        <div className="space-y-4 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary">Cuenta</p>
          <h1 className="text-4xl font-bold tracking-tight text-foreground">Cómo Eliminar Mi Cuenta</h1>
          <p className="mx-auto max-w-3xl text-base leading-7 text-muted-foreground">
            Esta página explica el flujo disponible dentro de Tec Community para eliminar tu cuenta, qué efectos tiene
            la eliminación y qué información puede conservarse por motivos legales, técnicos o de seguridad.
          </p>
        </div>

        <Card className="border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle>Eliminar tu cuenta desde la app</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-7 text-muted-foreground">
            <p>1. Inicia sesión en Tec Community.</p>
            <p>2. Ingresa a <strong>Mi Perfil</strong>.</p>
            <p>3. Dirígete a la sección <strong>Zona de peligro</strong>.</p>
            <p>4. Presiona <strong>Eliminar cuenta</strong>.</p>
            <p>5. Confirma la acción escribiendo la frase solicitada y acepta la eliminación definitiva.</p>
          </CardContent>
        </Card>

        <Card className="border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle>Qué ocurre cuando eliminas tu cuenta</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-7 text-muted-foreground">
            <p>
              La eliminación de cuenta es una acción irreversible. Una vez completada, ya no podrás iniciar sesión con
              la cuenta eliminada ni recuperar automáticamente el acceso, historial o configuraciones asociadas.
            </p>
            <div>
              <p className="font-medium text-foreground mb-2">Normalmente se elimina o desactiva:</p>
              <ul className="list-disc pl-5 space-y-2">
                {retentionItems.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="font-medium text-foreground mb-2">Podría conservarse por un tiempo limitado:</p>
              <ul className="list-disc pl-5 space-y-2">
                {retainedItems.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle>Soporte adicional</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-7 text-muted-foreground">
            <p>
              Si no puedes acceder a la aplicación o necesitas asistencia adicional sobre la eliminación de tu cuenta,
              puedes comunicarte con el equipo administrador por los canales oficiales habilitados por tu organización.
            </p>
            <p>
              Esta página se publica para facilitar el cumplimiento de los requisitos de distribución de tiendas como
              Google Play y App Store respecto al acceso a instrucciones claras de eliminación de cuenta.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
