import React from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/atoms/Button';

export default function PrivacyPolicy() {
  const [, navigate] = useLocation();

  return (
    <div className="max-w-3xl mx-auto p-6 prose">
      <div className="flex items-center justify-between">
        <h1>Política de Privacidad para Kodem Cards</h1>
        <div>
          <Button variant="ghost" size="sm" onClick={() => window.history.back()}>
            Volver
          </Button>
        </div>
      </div>

      <p><strong>Fecha de entrada en vigor:</strong> 10/11/2025</p>

      <p>
        Gracias por usar Kodem Cards (en adelante, "la Aplicación"). Esta Política de Privacidad describe cómo se maneja su información cuando utiliza nuestra aplicación.
      </p>

      <p>Nuestra filosofía es simple: recopilamos la menor cantidad de información posible para ofrecerle una gran experiencia de usuario.</p>

      <h2>1. Información que Recopilamos</h2>

      <p>No recopilamos, almacenamos ni compartimos ninguna <strong>información de identificación personal (PII)</strong>. Esto significa que:</p>
      <ul>
        <li>No le pedimos su nombre, correo electrónico, número de teléfono ni ninguna otra información de contacto.</li>
        <li>No utilizamos rastreadores de ubicación.</li>
        <li>No tenemos acceso a sus contactos, fotos ni archivos personales en su dispositivo.</li>
        <li>No creamos perfiles de usuario.</li>
      </ul>

      <p>La única información que se procesa es <strong>información no personal y técnica</strong>, necesaria para el funcionamiento de la aplicación:</p>
      <ul>
        <li>
          <strong>Datos de Red (Network Data):</strong> Para mostrarle los datos de las cartas (expansiones, precios, imágenes, etc.), la Aplicación se comunica con una API pública y de terceros: <code>https://api.kodemcards.xyz</code>. Como en cualquier comunicación por Internet, su dirección IP es visible para esta API como parte de la solicitud de red. No tenemos control sobre los datos que este servicio de terceros pueda registrar. Le recomendamos revisar su propia política de privacidad.
        </li>
        <li>
          <strong>Datos de Uso Anónimos:</strong> Podemos recopilar datos anónimos y agregados sobre cómo interactúa con la aplicación (por ejemplo, qué filtros son los más usados o informes de fallos). Esta información no se puede vincular a usted de ninguna manera y se utiliza únicamente para mejorar la estabilidad y la funcionalidad de la aplicación.
        </li>
      </ul>

      <h2>2. Cómo Usamos la Información</h2>
      <p>La información no personal que se recopila se utiliza exclusivamente para:</p>
      <ul>
        <li><strong>Proveer la funcionalidad principal de la Aplicación:</strong> Obtener y mostrar la información de las cartas que usted solicita a través de los filtros y la búsqueda.</li>
        <li><strong>Mejorar la Aplicación:</strong> Analizar informes de fallos anónimos para corregir errores y mejorar el rendimiento.</li>
      </ul>

      <h2>3. Almacenamiento Local de Datos</h2>
      <p>Para mejorar el rendimiento, la Aplicación puede almacenar ciertos datos localmente en su dispositivo. Esto puede incluir:</p>
      <ul>
        <li>Imágenes de cartas en caché para una carga más rápida (<code>cached_network_image</code>).</li>
        <li>Preferencias del usuario, como la última expansión seleccionada (si se implementara en el futuro).</li>
      </ul>
      <p>Estos datos se almacenan únicamente en su dispositivo y la Aplicación no los transmite a ningún servidor.</p>

      <h2>4. Privacidad de los Niños</h2>
      <p>Nuestra aplicación no está dirigida a niños menores de 13 años y no recopilamos intencionadamente información de identificación personal de niños. Si descubrimos que un niño menor de 13 años nos ha proporcionado información personal, la eliminaremos de inmediato.</p>

      <h2>5. Cambios a esta Política de Privacidad</h2>
      <p>Podemos actualizar nuestra Política de Privacidad de vez en cuando. Le notificaremos cualquier cambio publicando la nueva Política de Privacidad en esta página. Se le aconseja revisar esta Política de Privacidad periódicamente para cualquier cambio.</p>

      <h2>6. Contáctenos</h2>
      <p>
        Si tiene alguna pregunta o sugerencia sobre nuestra Política de Privacidad, no dude en contactarnos en: <strong>hola@kodemcards.xyz</strong>
      </p>

    </div>
  );
}
