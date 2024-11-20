const express = require('express');
const { createClient } = require('@supabase/supabase-js');

const router = express.Router();
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Crear un nuevo lead
router.post('/', async (req, res) => {
    const { name, email, phone } = req.body;
    const { data, error } = await supabase.from('leads').insert([{ name, email, phone }]);
    
    if (error) return res.status(400).json({ error: error.message });
    res.status(201).json(data);
});

// Obtener todos los leads
router.get('/', async (req, res) => {
    const { data, error } = await supabase.from('leads').select('*');
    
    if (error) return res.status(400).json({ error: error.message });
    res.status(200).json(data);
});


// En routes/leads.js
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { name, email, phone, status } = req.body;
    const { data, error } = await supabase
        .from('leads')
        .update({ name, email, phone, status })
        .eq('id', id);
    
    if (error) return res.status(400).json({ error: error.message });
    res.status(200).json(data);
});

module.exports = router;