const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');

const supabase = require('../server.js');

// Estados de conversación
const conversationStates = {
  INITIAL: 'initial',
  ASKING_BUDGET: 'asking_budget',
  ASKING_PROPERTY_TYPE: 'asking_property_type',
  ASKING_ROOMS: 'asking_rooms',
  ASKING_AREA: 'asking_area',
  ASKING_NEIGHBORHOOD: 'asking_neighborhood',
  ASKING_SELLING_INTENTION: 'asking_selling_intention',
  COMPLETED: 'completed'
};

async function findOrCreateLead(phoneNumber) {
  // Buscar lead existente
  const { data: existingLead, error: findError } = await supabase
    .from('leads')
    .select('*')
    .eq('phone', phoneNumber)
    .single();

  if (existingLead) return existingLead;

  // Crear nuevo lead con valores por defecto
  const { data: newLead, error: insertError } = await supabase
    .from('leads')
    .insert({
      name: 'Lead sin nombre', // Valor por defecto
      phone: phoneNumber,
      email: '', // Valor por defecto
      created_at: new Date(),
      status: 'pending',
      categorization_status: conversationStates.INITIAL
    })
    .select()
    .single();

  if (insertError) throw insertError;

  return newLead;
}

async function updateLeadState(leadId, newState) {
  const { error } = await supabase
    .from('leads')
    .update({ categorization_status: newState })
    .eq('id', leadId);

  if (error) throw error;
}

async function updateLead(leadId, updates) {
  const { error } = await supabase
    .from('leads')
    .update(updates)
    .eq('id', leadId);

  if (error) throw error;
}

async function handleWhatsAppConversation(from, message) {
  // Buscar o crear lead
  const lead = await findOrCreateLead(from);

  // Procesar mensaje según el estado actual
  switch(lead.categorization_status) {
    case conversationStates.INITIAL:
      return handleInitialMessage(lead, message);
    
    case conversationStates.ASKING_BUDGET:
      return handleBudgetResponse(lead, message);
    
    case conversationStates.ASKING_PROPERTY_TYPE:
      return handlePropertyTypeResponse(lead, message);
    
    // Agregar más casos para cada estado
    
    default:
      return "Disculpa, ha ocurrido un error. Comenzemos de nuevo.";
  }
}

// Funciones de manejo de estados
async function handleInitialMessage(lead, message) {
  await updateLeadState(lead.id, conversationStates.ASKING_BUDGET);
  
  return `¡Hola! Estamos buscando entender mejor tus necesidades inmobiliarias. 
¿Cuál es tu presupuesto aproximado para comprar una propiedad?`;
}

async function handleBudgetResponse(lead, message) {
  await updateLead(lead.id, { 
    budget_range: message,
    categorization_status: conversationStates.ASKING_PROPERTY_TYPE
  });

  return `Gracias por compartir tu presupuesto. 
¿Qué tipo de propiedad estás buscando? (Ejemplo: Apartamento, Casa, Terreno)`;
}

// Función de ejemplo para el siguiente estado
async function handlePropertyTypeResponse(lead, message) {
  await updateLead(lead.id, { 
    property_type_preference: message,
    categorization_status: conversationStates.ASKING_ROOMS
  });

  return `Entendido. ¿Cuántas habitaciones o ambientes buscas?`;
}

module.exports = { handleWhatsAppConversation, conversationStates };