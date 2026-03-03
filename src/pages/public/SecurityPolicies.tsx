import { ShieldCheck, Scale, Lock, Mail, Globe, CalendarDays } from "lucide-react";

export default function SecurityPolicies() {
  return (
    <section className="relative overflow-hidden py-10 md:py-16">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-secondary/10" />
      <div className="container relative z-10 max-w-5xl space-y-8">
        <header className="space-y-4 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-sm text-primary">
            <ShieldCheck className="h-4 w-4" />
            <span>Políticas de Seguridad y Legal</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight">Campus Tecnológico Tec</h1>
          <p className="text-muted-foreground text-base md:text-lg">
            Marco legal y lineamientos de privacidad para el uso de la plataforma institucional.
          </p>
        </header>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-xl border bg-card p-4 md:p-5">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <CalendarDays className="h-4 w-4 text-primary" />
              Última actualización
            </div>
            <p className="mt-2 text-sm text-muted-foreground">11/02/2026</p>
          </div>
          <div className="rounded-xl border bg-card p-4 md:p-5">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Mail className="h-4 w-4 text-primary" />
              Correo de contacto
            </div>
            <a href="mailto:ejemplo@ejemplo.com" className="mt-2 block text-sm text-primary hover:underline">
              ejemplo@ejemplo.com
            </a>
          </div>
          <div className="rounded-xl border bg-card p-4 md:p-5">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Globe className="h-4 w-4 text-primary" />
              Dominio oficial
            </div>
            <a
              href="https://app.tec.gt/"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 block text-sm text-primary hover:underline break-all"
            >
              https://app.tec.gt/
            </a>
          </div>
        </div>

        <article className="rounded-2xl border bg-card p-6 md:p-8 space-y-6">
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <Scale className="h-5 w-5 text-primary" />
            Aviso Legal
          </h2>
          <p className="text-sm text-muted-foreground">
            El presente Aviso Legal regula el uso del sitio web y la aplicación móvil accesibles a través del dominio
            oficial indicado. El acceso y uso de esta plataforma atribuye la condición de usuario, quien acepta los
            términos y condiciones aquí establecidos.
          </p>

          <div className="space-y-4">
            <div>
              <h3 className="font-semibold">Titular del sitio</h3>
              <p className="text-sm text-muted-foreground">
                El sitio web y la aplicación móvil son operados por Campus Tecnológico Tec, entidad ubicada en la
                República de Guatemala, en adelante "el Tec".
              </p>
            </div>

            <div>
              <h3 className="font-semibold">Objeto de la plataforma</h3>
              <p className="text-sm text-muted-foreground">
                Proporcionar a los Tec Members información y servicios relacionados con la vida institucional dentro del
                Campus Tecnológico Tec.
              </p>
              <ul className="mt-2 list-disc pl-5 text-sm text-muted-foreground space-y-1">
                <li>Eventos institucionales</li>
                <li>Novedades</li>
                <li>Comunicados oficiales</li>
                <li>Directorio interno</li>
                <li>Chat de servicio al cliente</li>
                <li>Reconocimientos</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold">Uso permitido</h3>
              <p className="text-sm text-muted-foreground">El usuario se compromete a utilizar la plataforma de manera responsable, conforme a la ley, la moral, el orden público y las buenas costumbres, absteniéndose de:</p>
              <ul className="mt-2 list-disc pl-5 text-sm text-muted-foreground space-y-1">
                <li>Realizar actos que dañen, inutilicen o deterioren la plataforma</li>
                <li>Introducir virus, malware o código malicioso</li>
                <li>Utilizar la información con fines distintos a los institucionales</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold">Propiedad intelectual</h3>
              <p className="text-sm text-muted-foreground">
                Todos los contenidos, textos, marcas, logotipos, diseños y elementos gráficos son propiedad del Tec o
                cuentan con autorización para su uso. Queda prohibida su reproducción total o parcial sin autorización
                expresa.
              </p>
            </div>

            <div>
              <h3 className="font-semibold">Responsabilidad</h3>
              <p className="text-sm text-muted-foreground">
                El Tec no garantiza la disponibilidad continua de la plataforma y no será responsable por interrupciones
                derivadas de mantenimiento, fallas técnicas o causas de fuerza mayor.
              </p>
            </div>

            <div>
              <h3 className="font-semibold">Legislación y jurisdicción</h3>
              <p className="text-sm text-muted-foreground">
                El presente Aviso Legal se rige por las leyes vigentes de la República de Guatemala, sometiéndose las
                partes a la jurisdicción de sus tribunales competentes.
              </p>
            </div>
          </div>
        </article>

        <article className="rounded-2xl border bg-card p-6 md:p-8 space-y-6">
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <Lock className="h-5 w-5 text-primary" />
            Políticas de Privacidad
          </h2>
          <p className="text-sm text-muted-foreground">
            En el Campus Tecnológico Tec reconocemos la importancia de la protección de los datos personales y nos
            comprometemos a tratarlos de forma lícita, responsable y confidencial.
          </p>

          <div className="space-y-4">
            <div>
              <h3 className="font-semibold">Datos personales recabados</h3>
              <ul className="mt-2 list-disc pl-5 text-sm text-muted-foreground space-y-1">
                <li>Nombre y apellidos</li>
                <li>Correo electrónico institucional o personal</li>
                <li>Número telefónico</li>
                <li>Información laboral relacionada con el campus</li>
                <li>Datos de uso y acceso a la plataforma</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold">Finalidad del tratamiento</h3>
              <ul className="mt-2 list-disc pl-5 text-sm text-muted-foreground space-y-1">
                <li>Identificar y autenticar a los Tec Members</li>
                <li>Gestionar el acceso a la plataforma</li>
                <li>Comunicar eventos, novedades y comunicados</li>
                <li>Brindar atención mediante el chat de servicio al cliente</li>
                <li>Administrar el directorio interno</li>
                <li>Gestionar y mostrar reconocimientos institucionales</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold">Medidas de seguridad</h3>
              <p className="text-sm text-muted-foreground">
                El Tec implementa medidas administrativas, técnicas y físicas razonables para proteger los datos
                personales contra daño, pérdida, alteración, destrucción o uso no autorizado.
              </p>
            </div>

            <div>
              <h3 className="font-semibold">Transferencia de datos</h3>
              <p className="text-sm text-muted-foreground">
                Los datos personales no serán compartidos con terceros, salvo cuando sea requerido por autoridad
                competente o para el cumplimiento de disposiciones legales aplicables.
              </p>
            </div>

            <div>
              <h3 className="font-semibold">Derechos del titular</h3>
              <p className="text-sm text-muted-foreground">
                El titular de los datos personales podrá solicitar el acceso, rectificación, actualización o eliminación
                de su información, mediante solicitud dirigida a la administración del Campus Tecnológico Tec.
              </p>
            </div>

            <div>
              <h3 className="font-semibold">Modificaciones</h3>
              <p className="text-sm text-muted-foreground">
                El Tec se reserva el derecho de modificar en cualquier momento la presente Política de Privacidad. Las
                modificaciones serán publicadas a través de la plataforma.
              </p>
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}
