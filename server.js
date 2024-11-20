const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

// Inicializar Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

app.use(cors());
app.use(express.json());

const leadRoutes = require('./routes/leads');
app.use('/api/leads', leadRoutes);


// Endpoint de prueba para verificar la conexión con Supabase
app.get('/api/test', async (req, res) => {
    const { data, error } = await supabase.from('leads').select('*');
    if (error) return res.status(400).json({ error: error.message });
    res.status(200).json(data);
});

// Iniciar el servidor
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
