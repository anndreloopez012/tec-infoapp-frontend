import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const sections = [
  {
    title: '1. Aceptación de los términos',
    body:
      'Al acceder, registrarte o utilizar Tec Community aceptas estos Términos y Condiciones, así como las políticas publicadas dentro de la plataforma. Si no estás de acuerdo con ellos, no debes usar la aplicación ni sus servicios asociados.',
  },
  {
    title: '2. Objeto del servicio',
    body:
      'Tec Community es una plataforma digital orientada a centralizar noticias, eventos, comunicados, calendarios, contenido institucional y otros recursos de interés para la comunidad Tec. Algunas funcionalidades pueden variar según tu tipo de usuario, rol o estado de cuenta.',
  },
  {
    title: '3. Registro y cuenta de usuario',
    body:
      'Para utilizar ciertas funciones es necesario contar con una cuenta válida. Eres responsable de mantener la confidencialidad de tus credenciales, de la actividad realizada desde tu cuenta y de proporcionar información veraz, exacta y actualizada.',
  },
  {
    title: '4. Uso permitido',
    body:
      'Solo puedes utilizar la aplicación con fines legítimos, institucionales o informativos. Está prohibido publicar contenido ilícito, engañoso, ofensivo o que vulnere derechos de terceros, así como intentar acceder sin autorización, alterar servicios, automatizar abusivamente la plataforma o afectar su seguridad.',
  },
  {
    title: '5. Contenido y propiedad intelectual',
    body:
      'El nombre, diseño, logotipos, interfaces, textos, imágenes, documentos, publicaciones y demás elementos integrados en Tec Community pertenecen a sus titulares respectivos y están protegidos por la normativa aplicable. No se autoriza su reproducción, distribución o explotación fuera de los usos permitidos sin autorización previa.',
  },
  {
    title: '6. Información publicada y disponibilidad',
    body:
      'Aunque se procura mantener información actualizada y precisa, Tec Community puede contener cambios, errores involuntarios o publicaciones sujetas a revisión. La disponibilidad del servicio puede verse afectada por mantenimiento, actualizaciones, incidentes técnicos o causas ajenas al control de la plataforma.',
  },
  {
    title: '7. Notificaciones y comunicaciones',
    body:
      'Al usar la aplicación puedes recibir notificaciones dentro de la app, por web push o por canales móviles nativos sobre eventos, contenidos nuevos, avisos operativos y comunicaciones relevantes. Puedes gestionar ciertos permisos desde tu dispositivo o navegador, aunque algunas comunicaciones esenciales pueden seguir mostrándose dentro de la plataforma.',
  },
  {
    title: '8. Privacidad y tratamiento de datos',
    body:
      'El uso de la plataforma puede implicar tratamiento de datos de cuenta, actividad, dispositivos, tokens de notificación y registros operativos necesarios para la prestación del servicio, seguridad y trazabilidad. El tratamiento se realiza conforme a las políticas internas, requerimientos de seguridad y obligaciones aplicables.',
  },
  {
    title: '9. Suspensión o cancelación de acceso',
    body:
      'Tec Community podrá restringir, suspender o cancelar cuentas cuando exista incumplimiento de estos términos, riesgos de seguridad, uso indebido, actividad sospechosa, requerimientos institucionales o baja del usuario dentro de los procesos correspondientes.',
  },
  {
    title: '10. Eliminación de cuenta',
    body:
      'Los usuarios pueden solicitar o ejecutar la eliminación de su cuenta conforme al flujo disponible en la aplicación. La eliminación puede suponer la pérdida de acceso, preferencias, historial y datos vinculados a la cuenta, salvo aquella información que deba conservarse por razones legales, operativas, de auditoría o seguridad.',
  },
  {
    title: '11. Limitación de responsabilidad',
    body:
      'Tec Community se ofrece como una herramienta de apoyo y comunicación. En la medida permitida por la normativa aplicable, no se garantiza que el servicio esté libre de interrupciones o errores, ni se asume responsabilidad por daños indirectos derivados del uso o imposibilidad de uso de la plataforma.',
  },
  {
    title: '12. Cambios a los términos',
    body:
      'Estos términos pueden actualizarse en cualquier momento para reflejar cambios funcionales, legales, operativos o de seguridad. La versión vigente será la publicada en la aplicación y el uso continuado del servicio después de una actualización implicará su aceptación.',
  },
  {
    title: '13. Contacto',
    body:
      'Si tienes dudas sobre estos términos, sobre el uso de la cuenta o sobre la plataforma, puedes comunicarte con el equipo administrador de Tec Community por los canales oficiales habilitados por la organización.',
  },
];

export default function TermsAndConditions() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-5xl py-12 space-y-8">
        <div className="space-y-4 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary">Legal</p>
          <h1 className="text-4xl font-bold tracking-tight text-foreground">Términos y Condiciones</h1>
          <p className="mx-auto max-w-3xl text-base leading-7 text-muted-foreground">
            Este documento regula el uso de Tec Community, sus contenidos, sus funcionalidades y las condiciones
            aplicables a las cuentas de usuario dentro de la plataforma.
          </p>
        </div>

        <Card className="border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle>Resumen</CardTitle>
          </CardHeader>
          <CardContent className="text-sm leading-7 text-muted-foreground">
            Al utilizar Tec Community aceptas un uso responsable de la plataforma, el resguardo de tus credenciales,
            la observancia de las reglas de publicación y convivencia, y el tratamiento de información necesario para
            operar el servicio, mantener la seguridad y entregar comunicaciones relevantes a la comunidad.
          </CardContent>
        </Card>

        <div className="space-y-5">
          {sections.map((section) => (
            <Card key={section.title} className="border-border/70 shadow-sm">
              <CardHeader>
                <CardTitle className="text-xl">{section.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm leading-7 text-muted-foreground">
                {section.body}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
