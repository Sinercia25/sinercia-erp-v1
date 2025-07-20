// COMPONENTE: HowItWorks.tsx
// Este componente muestra el bloque "¿Cómo funciona CeoBot?" en 4 pasos claros

import { FC } from "react";
import { CheckCircleIcon, MessageCircleIcon, BrainIcon, BarChart3Icon } from "lucide-react";

// Estilos generales con Tailwind
const steps = [
  {
    icon: <MessageCircleIcon className="w-8 h-8 text-[#00C2CB]" />,
    title: "1. Le hablás como a un colega",
    description: "Consultale como si fuera humano: '¿Cuánto vendimos?', '¿Qué dice el contrato?', '¿Qué stock queda?'.",
  },
  {
    icon: <BrainIcon className="w-8 h-8 text-[#00C2CB]" />,
    title: "2. CeoBot entiende tu intención",
    description: "Usa inteligencia artificial para comprender lo que necesitás, aunque esté escrito en lenguaje natural.",
  },
  {
    icon: <BarChart3Icon className="w-8 h-8 text-[#00C2CB]" />,
    title: "3. Consulta tu empresa real",
    description: "Se conecta al Data Warehouse, busca datos reales o documentos, y procesa la información necesaria.",
  },
  {
    icon: <CheckCircleIcon className="w-8 h-8 text-[#00C2CB]" />,
    title: "4. Te da respuestas útiles",
    description: "Te contesta con claridad y, si corresponde, sugiere decisiones inteligentes basadas en tus datos.",
  },
];

const HowItWorks: FC = () => {
  return (
    <section className="bg-white py-16 px-6 md:px-20" id="como-funciona">
      {/* Título principal */}
      <h2 className="text-3xl md:text-4xl font-bold text-[#222B3A] text-center mb-4">
        ¿Cómo funciona CeoBot?
      </h2>
      <p className="text-center text-gray-500 mb-12 max-w-2xl mx-auto">
        Desde tu primer mensaje, CeoBot se conecta con los datos reales de tu empresa y te responde con inteligencia.
      </p>

      {/* Grilla de pasos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 max-w-5xl mx-auto">
        {steps.map((step, index) => (
          <div
            key={index}
            className="flex flex-col md:flex-row items-start gap-4 border border-gray-100 rounded-xl shadow-sm p-6 hover:shadow-md transition"
          >
            {/* Ícono */}
            <div className="shrink-0">{step.icon}</div>

            {/* Texto */}
            <div>
              <h3 className="text-lg font-semibold text-[#222B3A]">{step.title}</h3>
              <p className="text-gray-600">{step.description}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default HowItWorks;
