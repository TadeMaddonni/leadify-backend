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

// services/whatsappService.js
const conversationSessions = new Map();

async function handleWhatsAppConversation(from, message) {
  // Obtener o crear sesión de conversación
  let session = conversationSessions.get(from);
  
  if (!session) {
    session = {
      phoneNumber: from,
      currentState: conversationStates.INITIAL,
      responses: {}
    };
    conversationSessions.set(from, session);
  }
  console.log('Sesión actual:', session.currentState);
  // Procesar mensaje según el estado actual
  switch(session.currentState) {
    case conversationStates.INITIAL:
      return handleInitialMessage(session, message);
    
    case conversationStates.ASKING_BUDGET:
      return handleBudgetResponse(session, message);
    
    case conversationStates.ASKING_PROPERTY_TYPE:
      return handlePropertyTypeResponse(session, message);
    
    case conversationStates.ASKING_ROOMS:
      return handleRoomsResponse(session, message);
    
    case conversationStates.ASKING_AREA:
      return handleAreaResponse(session, message);
    
    case conversationStates.ASKING_NEIGHBORHOOD:
      return handleNeighborhoodResponse(session, message);
    
    case conversationStates.ASKING_SELLING_INTENTION:
      return await handleSellingIntentionResponse(session, message);
    
    case conversationStates.COMPLETED:
      return await finalizeConversation(session);
    
    default:
      return "Disculpa, ha ocurrido un error. Comenzemos de nuevo.";
  }
}

function handleInitialMessage(session, message) {
  session.currentState = conversationStates.ASKING_BUDGET;
  
  return `¡Hola! Estamos buscando entender mejor tus necesidades inmobiliarias. 
¿Cuál es tu presupuesto aproximado para comprar una propiedad?`;
}

function handleBudgetResponse(session, message) {
  session.responses.budget = message;
  session.currentState = conversationStates.ASKING_PROPERTY_TYPE;

  return `Gracias por compartir tu presupuesto. 
¿Qué tipo de propiedad estás buscando? (Ejemplo: Apartamento, Casa, Terreno)`;
}

function handlePropertyTypeResponse(session, message) {
  session.responses.propertyType = message;
  session.currentState = conversationStates.ASKING_ROOMS;

  return `Entendido. ¿Cuántas habitaciones o ambientes buscas?`;
}

function handleRoomsResponse(session, message) {
  session.responses.rooms = message;
  session.currentState = conversationStates.ASKING_AREA;

  return `Gracias. ¿Cuál es el área aproximada que buscas? (en metros cuadrados)`;
}

function handleAreaResponse(session, message) {
  session.responses.area = message;
  session.currentState = conversationStates.ASKING_NEIGHBORHOOD;

  return `Perfecto. ¿En qué barrio o zona estás buscando?`;
}

function handleNeighborhoodResponse(session, message) {
  session.responses.neighborhood = message;
  session.currentState = conversationStates.ASKING_SELLING_INTENTION;

  return `Último detalle, ¿estás considerando vender alguna propiedad actualmente? (Sí/No)`;
}

async function handleSellingIntentionResponse(session, message) {
    session.responses.sellingIntention = message;
    session.currentState = conversationStates.COMPLETED;
    try {
        const response = await finalizeConversation(session);
        return `¡Gracias por compartir esta información! Pronto nos pondremos en contacto contigo.`;
    } catch (error) {
        console.log('Error al finalizar conversación:', error);
    }
    
}

async function finalizeConversation(session) {
    try {
      console.log('Finalizando conversación:', session);
    // Crear lead con la información recopilada
    
    const { data: newLead, error } = await supabase
      .from('leads')
      .insert({
        phone: session.phoneNumber,
        name: 'Lead sin nombre',
        email: '', // Opcional
        budget_range: session.responses.budget,
        property_type_preference: session.responses.propertyType,
        desired_rooms: parseInt(session.responses.rooms),
        preferred_neighborhood: session.responses.neighborhood,
        is_selling: session.responses.sellingIntention.toLowerCase().includes('sí'),
        categorization_status: 'completed',
        status: 'pending',
        created_at: new Date()
      });
      if (error) throw new Error('Error al insertar en supabase:', error.message);
    // Limpiar sesión
    conversationSessions.delete(session.phoneNumber);
    

    return "Hemos guardado tu información. Un asesor se contactará contigo pronto.";
  } catch (error) {
    console.error('Error al guardar lead:', error);
    return "Hubo un problema guardando tu información. Intenta nuevamente más tarde.";
  }
}

module.exports = { 
  handleWhatsAppConversation, 
  conversationStates 
};