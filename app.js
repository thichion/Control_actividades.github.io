import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Configuración de Supabase
const supabaseUrl = "https://otvcwvnlndxtzzmeqtcw.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im90dmN3dm5sbmR4dHp6bWVxdGN3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc3NTg0OTQsImV4cCI6MjA2MzMzNDQ5NH0.psGUAZjKc_Ic9CFeumOIwS5DNWkgtABNZlcN0iig0cE";
const supabase = createClient(supabaseUrl, supabaseKey);

// Función para mostrar mensajes dinámicos (los pequeños que desaparecen)
function showMessage(message, type) {
    const messageDisplay = document.getElementById('messageDisplay');
    if (!messageDisplay) return;

    messageDisplay.textContent = message;
    messageDisplay.className = `center message-box ${type} show`;

    setTimeout(() => {
        messageDisplay.classList.remove('show');
    }, 3000);
}

// Función para mostrar los mensajes estáticos (los grandes)
function toggleStaticMessage(elementId) {
    const mensajeAceptado = document.getElementById("mensajeAceptado");
    const mensajeRechazado = document.getElementById("mensajeRechazado");
    
    // Ocultar ambos mensajes estáticos
    mensajeAceptado.classList.remove('show');
    mensajeRechazado.classList.remove('show');

    // Mostrar solo el mensaje deseado
    const element = document.getElementById(elementId);
    if (element) {
        element.classList.add('show');
    }
}

// Función para ocultar los botones
function hideButtons() {
    const btnAceptar = document.getElementById("btnAceptar");
    const btnRechazar = document.getElementById("btnRechazar");
    if (btnAceptar) btnAceptar.style.display = 'none';
    if (btnRechazar) btnRechazar.style.display = 'none';
}

// Lógica de inicio al cargar la página
document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(window.location.search);

    // Actualizar datos visibles en la página
    document.querySelector("p.actividad").textContent = params.get("actividad") || "No definido";
    document.querySelector("p.lugar").textContent = params.get("lugar") || "No definido";
    document.querySelector("p.fecha").textContent = params.get("fecha") || "No definido";
    document.querySelector("p.supervisor").textContent = params.get("supervisor") || "No definido";
    document.querySelector("p.horas").textContent = params.get("horas") || "No definido";
    document.querySelector("p.nombre").textContent = params.get("nombre") || "No definido";

    const solicitudId = params.get("id");
    if (!solicitudId) {
        showMessage("❌ No se especificó el ID de la solicitud.", "error");
        hideButtons(); // No hay ID, no se necesitan botones
        return;
    }

    // --- NUEVO CÓDIGO PARA VERIFICAR EL ESTADO AL CARGAR ---
    const { data, error } = await supabase
        .from("Actividades")
        .select("Estado")
        .eq("id_actividades", solicitudId)
        .single();
    
    if (error && error.code === 'PGRST116') {
        // La fila no fue encontrada, lo que indica que fue eliminada
        toggleStaticMessage("mensajeRechazado");
        hideButtons();
        console.log("Solicitud ya rechazada (fila no encontrada).");
    } else if (data && data.Estado === true) {
        // La solicitud ya fue aceptada
        toggleStaticMessage("mensajeAceptado");
        hideButtons();
        console.log("Solicitud ya aceptada.");
    } else {
        // La solicitud está pendiente, se muestran los botones
        console.log("Solicitud pendiente.");
        const btnAceptar = document.getElementById("btnAceptar");
        const btnRechazar = document.getElementById("btnRechazar");

        // Aceptar solicitud
        btnAceptar.addEventListener("click", async () => {
            showMessage("Procesando aceptación...", "info");
            const { error: updateError } = await supabase
                .from("Actividades")
                .update({ Estado: true })
                .eq("id_actividades", solicitudId);

            if (updateError) {
                console.error("❌ ERROR de Supabase al aceptar:", updateError);
                showMessage("❌ Error al aceptar la solicitud.", "error");
            } else {
                showMessage("✅ Solicitud aceptada correctamente.", "success");
                toggleStaticMessage("mensajeAceptado");
                hideButtons();
            }
        });

        // Rechazar solicitud
        btnRechazar.addEventListener("click", async () => {
            showMessage("Procesando rechazo...", "info");
            
            const { data, error } = await supabase
                .from("Actividades")
                .select("*")
                .eq("id_actividades", solicitudId)
                .single(); // 👈 trae un objeto, no array

                if (error) {
                console.error("Error al seleccionar:", error);
                } else if (data) {
                // 2. Insertar la misma fila (puedes modificar campos si quieres)
                const { data: inserted, error: insertError } = await supabase
                    .from("Registro_actividades_soporte")
                    .insert([
                    {
                        id:data.id_actividades,
                        Actividad: data.Actividad,
                        Lugar:data.Lugar,
                        Fecha:data.Fecha,
                        Supervisor:data.Supervisor,
                        Documento_estudiante:data.Numero_estudiantes,
                        Cantidad_de_horas:data.Cantidad_de_horas,
                        Nombre:data.Nombre,
                        Correo: data.Correo,
                        // Estado: data.Estado
                    }
                    ])
                    .select();
                if (insertError) {
                    console.error("Error al insertar:", insertError);
                } else {
                    console.log("Fila insertada:", inserted);
                }
                }
            const { error: deleteError } = await supabase
                .from("Actividades")
                .delete()
                .eq("id_actividades", solicitudId);

            if (deleteError) {
                console.error("❌ ERROR de Supabase al rechazar:", deleteError);
                showMessage("❌ Error al rechazar (eliminar) la solicitud.", "error");
            } else {
                showMessage("✅ Solicitud eliminada correctamente.", "success");
                toggleStaticMessage("mensajeRechazado");
                hideButtons();
            }
        });
    }
});
