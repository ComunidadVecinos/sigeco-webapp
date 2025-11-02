document.addEventListener('DOMContentLoaded', function() {
    const url_vivienda = 'registro-codigo.html';
    const url_comunidad = 'registro-comunidad.html';

    const btnSiguiente = document.getElementById('btn-siguiente');
    const radios = document.querySelectorAll('input[name="metodo-registro"]');

    function actualizaBoton(){
        btnSiguiente.classList.remove('disabled');
        btnSiguiente.removeAttribute('aria-disabled');

        const valorSeleccionado = document.querySelector('input[name="metodo-registro"]:checked').value;

        if(valorSeleccionado === 'vivienda'){
            btnSiguiente.href = url_vivienda;
        }
        else if(valorSeleccionado === 'comunidad'){
            btnSiguiente.href = url_comunidad;
        }
    }

    radios.forEach(function(radio) {
        radio.addEventListener('change', actualizaBoton);
    });
});