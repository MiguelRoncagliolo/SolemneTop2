export interface PainPointSeed {
  title: string;
  category: string;
  description: string;
  evidence: string;
  regionCountry: string;
  severity: "low" | "medium" | "high" | "critical";
  digitalOpportunity: string;
  sourceName: string;
  sourceUrl: string;
  citationText: string;
}

export const LATAM_PAIN_POINT_SEEDS: PainPointSeed[] = [
  {
    title: "Brecha de inclusión financiera en segmentos vulnerables",
    category: "fintech",
    description:
      "Una parte relevante de adultos en la región sigue con acceso limitado a servicios financieros formales y productos digitales seguros.",
    evidence:
      "El Banco Mundial reporta que aún existe una población no bancarizada significativa y que la expansión digital requiere gestión de riesgos de protección al consumidor.",
    regionCountry: "LatAm",
    severity: "high",
    digitalOpportunity:
      "Onboarding digital, scoring alternativo, cobranza inteligente y productos financieros embebidos para pymes y trabajadores informales.",
    sourceName: "Banco Mundial - Financial Inclusion",
    sourceUrl: "https://www.worldbank.org/en/topic/financialinclusion/overview",
    citationText:
      "Inclusive finance drives growth and resilience, yet 1.4 billion adults globally remain unbanked.",
  },
  {
    title: "Ineficiencias logísticas y costos altos de última milla",
    category: "logística",
    description:
      "Persisten ineficiencias en cadenas logísticas y trazabilidad fragmentada, afectando tiempos de entrega y costos operativos.",
    evidence:
      "CEPAL analiza ineficiencias logísticas en la región y su impacto sobre competitividad y sostenibilidad del crecimiento.",
    regionCountry: "LatAm",
    severity: "high",
    digitalOpportunity:
      "Sistemas SaaS para ruteo, visibilidad en tiempo real, optimización de flota y coordinación multi-actor.",
    sourceName: "CEPAL - Logistics inefficiencies in Latin American landlocked countries",
    sourceUrl:
      "https://www.cepal.org/en/publications/37774-logistics-inefficiencies-latin-american-landlocked-countries",
    citationText:
      "Identifies logistics inefficiencies in Latin America and the Caribbean detrimental to sustainable growth.",
  },
  {
    title: "Desalineación entre formación y habilidades demandadas",
    category: "educación",
    description:
      "La región muestra rezagos en habilidades de adultos y jóvenes respecto a las exigencias de empleos de mayor valor agregado.",
    evidence:
      "OECD reporta que la región avanza en acceso, pero mantiene brechas en desarrollo de habilidades clave y transición laboral.",
    regionCountry: "LatAm",
    severity: "high",
    digitalOpportunity:
      "Plataformas de upskilling, assessment continuo, formación modular y matching formación-empleo basado en datos.",
    sourceName: "OECD - Skills in Latin America (PIAAC)",
    sourceUrl: "https://www.oecd.org/en/publications/skills-in-latin-america_5ab893f0-en.html",
    citationText:
      "LAC countries lag behind in skills development among both students and the wider adult population.",
  },
  {
    title: "Acceso desigual y resiliencia limitada en atención primaria",
    category: "salud",
    description:
      "Sistemas de salud enfrentan brechas de acceso y baja resiliencia operativa en atención primaria, especialmente bajo presión.",
    evidence:
      "Comisión World Bank-PAHO advierte riesgos de no fortalecer resiliencia y capacidades de atención primaria en la región.",
    regionCountry: "LatAm",
    severity: "critical",
    digitalOpportunity:
      "Triage digital, seguimiento remoto, interoperabilidad clínica y herramientas de priorización para equipos de APS.",
    sourceName: "PAHO/World Bank - PHC resilience report",
    sourceUrl:
      "https://www.paho.org/en/news/29-9-2025-lives-and-economies-risk-weak-primary-health-care-latin-america-and-caribbean-world",
    citationText:
      "Failure to build resilience in primary health care could lead to preventable losses in lives and economic development.",
  },
  {
    title: "Baja digitalización en gestión productiva agro",
    category: "agro",
    description:
      "Productores pequeños y medianos enfrentan dificultades de adopción tecnológica para gestión de riesgo, productividad y comercialización.",
    evidence:
      "FAO señala la necesidad de acelerar transformación digital rural y uso de datos para cadenas alimentarias más resilientes.",
    regionCountry: "LatAm",
    severity: "medium",
    digitalOpportunity:
      "Herramientas móviles de gestión predial, trazabilidad, pronóstico y coordinación comercial en redes de productores.",
    sourceName: "FAO - Regional digital agriculture references",
    sourceUrl: "https://www.fao.org/americas/prioridades/transformacion-digital/es/",
    citationText:
      "Digital transformation is presented as a core enabler for resilient and inclusive agrifood systems in the region.",
  },
  {
    title: "Trámites públicos con fricción y baja interoperabilidad",
    category: "gobierno",
    description:
      "Ciudadanos y pymes enfrentan tiempos altos y procesos fragmentados por baja interoperabilidad entre sistemas estatales.",
    evidence:
      "BID impulsa agendas de gobierno digital orientadas a interoperabilidad y simplificación de servicios públicos.",
    regionCountry: "LatAm",
    severity: "high",
    digitalOpportunity:
      "Plataformas govtech de expediente único, firma digital, automatización de flujos y seguimiento de SLA ciudadano.",
    sourceName: "BID - Digital government agenda",
    sourceUrl: "https://www.iadb.org/en/topics/modernization-state/digital-government",
    citationText:
      "Digital government programs emphasize interoperability, service quality and citizen-centered design.",
  },
  {
    title: "Baja productividad y gestión operativa reactiva en pymes",
    category: "productividad pyme",
    description:
      "Muchas pymes operan con baja digitalización comercial, financiera y operativa, dificultando escalar y sostener márgenes.",
    evidence:
      "BID destaca debilidades en calidad del empleo y productividad, con foco en necesidad de capacidades empresariales y tecnológicas.",
    regionCountry: "LatAm",
    severity: "high",
    digitalOpportunity:
      "ERP liviano, BI de caja, automatización comercial y copilotos operativos para gestión diaria de pymes.",
    sourceName: "BID - Better Jobs Index",
    sourceUrl:
      "https://www.iadb.org/en/news/there-are-jobs-latin-america-and-caribbean-their-quality-urgently-needs-improvement",
    citationText:
      "Employment quality remains low in the region, highlighting productivity and capability gaps.",
  },
  {
    title: "Alta informalidad laboral con baja protección social",
    category: "empleo informal",
    description:
      "La informalidad limita ingresos estables, cobertura social y acceso a financiamiento, afectando movilidad económica.",
    evidence:
      "BID reporta alta proporción de empleo informal en la región y urgencia de mejorar calidad del empleo.",
    regionCountry: "LatAm",
    severity: "critical",
    digitalOpportunity:
      "Plataformas de formalización gradual, identidad laboral portable, pagos y beneficios flexibles para independientes.",
    sourceName: "BID - Better Jobs Index",
    sourceUrl:
      "https://www.iadb.org/en/news/there-are-jobs-latin-america-and-caribbean-their-quality-urgently-needs-improvement",
    citationText: "Nearly 55% of workers in LAC have informal jobs without contract or social security.",
  },
  {
    title: "Conversión baja y costos altos en comercio digital",
    category: "comercio digital",
    description:
      "Negocios digitales enfrentan CAC elevado, baja retención y fricción logística/medios de pago en múltiples mercados.",
    evidence:
      "CEPAL y actores regionales destacan desafíos de adopción digital empresarial e integración logística-comercial.",
    regionCountry: "LatAm",
    severity: "medium",
    digitalOpportunity:
      "Herramientas de CRO, orquestación omnicanal, checkout local y stack de retención con analítica predictiva.",
    sourceName: "CEPAL - Digital transformation and productive development",
    sourceUrl:
      "https://www.cepal.org/en/topics/digital-agenda-latin-america-and-caribbean-elac",
    citationText:
      "Regional digital agenda emphasizes productive digital transformation and inclusion across sectors.",
  },
];
