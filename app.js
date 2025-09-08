import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Configuración de Supabase
const supabaseUrl = "https://otvcwvnlndxtzzmeqtcw.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im90dmN3dm5sbmR4dHp6bWVxdGN3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc3NTg0OTQsImV4cCI6MjA2MzMzNDQ5NH0.psGUAZjKc_Ic9CFeumOIwS5DNWkgtABNZlcN0iig0cE";
const supabase = createClient(supabaseUrl, supabaseKey);

// Función para mostrar mensajes dinámicos
function showMessage(message, type) {
    const messageDisplay = document.getElementById("messageDisplay");
    if (!messageDisplay) return;

    messageDisplay.textContent = message;
    messageDisplay.className = `center message-box ${type} show`;

    setTimeout(() => {
        messageDisplay.classList.remove("show");
    }, 3000);
}

// Función para mostrar mensajes estáticos
function toggleStaticMessage(elementId) {
    const mensajeAceptado = document.getElementById("mensajeAceptado");
    const mensajeRechazado = document.getElementById("mensajeRechazado");

    mensajeAceptado.classList.remove("show");
    mensajeRechazado.classList.remove("show");

    const element = document.getElementById(elementId);
    if (element) element.classList.add("show");
}

// Función para ocultar botones principales
function hideButtons() {
    const btnAceptar = document.getElementById("btnAceptar");
    const btnRechazar1 = document.getElementById("btnRechazar1");
    if (btnAceptar) btnAceptar.style.display = "none";
    if (btnRechazar1) btnRechazar1.style.display = "none";
}

// Función para mostrar botones principales
function showButtons() {
    const btnAceptar = document.getElementById("btnAceptar");
    const btnRechazar1 = document.getElementById("btnRechazar1");
    if (btnAceptar) btnAceptar.style.display = "inline-block";
    if (btnRechazar1) btnRechazar1.style.display = "inline-block";
}

document.addEventListener("DOMContentLoaded", async () => {
    const params = new URLSearchParams(window.location.search);

    document.querySelector("p.actividad").textContent = params.get("actividad") || "No definido";
    document.querySelector("p.lugar").textContent = params.get("lugar") || "No definido";
    document.querySelector("p.fecha").textContent = params.get("fecha") || "No definido";
    document.querySelector("p.supervisor").textContent = params.get("supervisor") || "No definido";
    document.querySelector("p.horas").textContent = params.get("horas") || "No definido";
    document.querySelector("p.nombre").textContent = params.get("nombre") || "No definido";

    const solicitudId = params.get("id");
    if (!solicitudId) {
        showMessage("❌ No se especificó el ID de la solicitud.", "error");
        hideButtons();
        return;
    }

    const { data, error } = await supabase
        .from("Actividades")
        .select("Estado")
        .eq("id_actividades", solicitudId)
        .single();

    const btnAceptar = document.getElementById("btnAceptar");
    const btnRechazar1 = document.getElementById("btnRechazar1");
    const btnRechazar2 = document.getElementById("btnRechazar2");
    const btnVolver = document.getElementById("btnVolver");
    const razonForm = document.getElementById("razon_form");
    const razonTextarea = document.getElementById("razon");

    if (error && error.code === "PGRST116") {
        toggleStaticMessage("mensajeRechazado");
        hideButtons();
        console.log("Solicitud ya rechazada (no encontrada).");
    } else if (data && data.Estado === true) {
        toggleStaticMessage("mensajeAceptado");
        hideButtons();
        console.log("Solicitud ya aceptada.");
    } else {
        console.log("Solicitud pendiente.");

        // --- Aceptar ---
        btnAceptar?.addEventListener("click", async () => {
            showMessage("Procesando aceptación...", "info");
            const { error: updateError } = await supabase
                .from("Actividades")
                .update({ Estado: true })
                .eq("id_actividades", solicitudId);

            if (updateError) {
                console.error("❌ Error al aceptar:", updateError);
                showMessage("❌ Error al aceptar.", "error");
            } else {
                showMessage("✅ Solicitud aceptada.", "success");
                toggleStaticMessage("mensajeAceptado");
                hideButtons();
            }
        });

        // --- Rechazar1 → mostrar form ---
        btnRechazar1?.addEventListener("click", () => {
            hideButtons();
            if (razonForm) razonForm.style.display = "block";
            if (btnRechazar2) btnRechazar2.style.display = "inline-block";
            if (btnVolver) btnVolver.style.display = "inline-block";
        });

        // --- Volver → restaurar botones principales ---
        btnVolver?.addEventListener("click", () => {
            if (razonForm) razonForm.style.display = "none";
            if (btnRechazar2) btnRechazar2.style.display = "none";
            if (btnVolver) btnVolver.style.display = "none";
            showButtons();
        });

        // --- Rechazar2 → validar, insertar con Razon y borrar ---
        btnRechazar2?.addEventListener("click", async () => {
            const razonTexto = razonTextarea?.value.trim();
            if (!razonTexto) {
                showMessage("❌ Inserte una razón para continuar.", "error");
                return;
            }

            showMessage("⏳ Procesando rechazo...", "info");

            const { data, error } = await supabase
                .from("Actividades")
                .select("*")
                .eq("id_actividades", solicitudId)
                .single();

            if (error) {
                console.error("Error al seleccionar:", error);
                return;
            }

            if (data) {
                const { error: insertError } = await supabase
                    .from("Registro_actividades_soporte")
                    .insert([{
                        id: data.id_actividades,
                        Actividad: data.Actividad,
                        Lugar: data.Lugar,
                        Fecha: data.Fecha,
                        Supervisor: data.Supervisor,
                        Documento_estudiante: data.Numero_estudiantes,
                        Cantidad_de_horas: data.Cantidad_de_horas,
                        Nombre: data.Nombre,
                        Correo: data.Correo,
                        Razon: razonTexto
                    }]);

                if (insertError) {
                    console.error("Error al insertar:", insertError);
                } else {
                    console.log("Fila insertada con rechazo.");
                }
            }

            const { error: deleteError } = await supabase
                .from("Actividades")
                .delete()
                .eq("id_actividades", solicitudId);

            if (deleteError) {
                console.error("❌ Error al rechazar:", deleteError);
                showMessage("❌ Error al rechazar.", "error");
            } else {
                showMessage("✅ Solicitud rechazada.", "success");
                toggleStaticMessage("mensajeRechazado");
                hideButtons();
            }
        });
    }
});
