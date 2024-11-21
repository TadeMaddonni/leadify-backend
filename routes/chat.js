const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const twilio = require('twilio');

const router = express.Router();

const supabase = require('../server.js');

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioClient = twilio(accountSid, authToken);
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

const procesarMensaje = require('../utils/chat/actions');
const { handleWhatsAppConversation } = require('../services/whatsapp');

// Endpoint para recibir mensajes
router.post('/webhook', async (req, res) => {
  try {
    // console.log('Mensaje recibido:', req.body);
    const { From, Body } = req.body;
    console.log(From)
    // Procesar mensaje y obtener respuesta
    const responseMessage = await handleWhatsAppConversation(From, Body);
    
    // Enviar respuesta por WhatsApp
    await twilioClient.messages.create({
      body: responseMessage,
      from: 'whatsapp:+14155238886', // Número de WhatsApp de Twilio
      to: From // Añadir prefijo whatsapp
    });

    res.status(200).send('Mensaje procesado');

  } catch (error) {
    console.error('Error en webhook:', error);
    res.status(500).send('Error procesando mensaje');
  }
});

// Endpoint para enviar mensaje
router.post('/send-whatsapp', async (req, res) => {
    const { to, message } = req.body;
    
    // await sendWhatsAppMessage(to, message);
    console.log('Mensaje enviado');
    res.status(200).send('Mensaje enviado');
});


module.exports = router;