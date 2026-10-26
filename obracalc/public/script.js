const screens = [
    'welcome',
    'register',
    'login',
    'recuperar',
    'menu',
    'muro',
    'viga',
    'columna',
    'contrapiso',
    'techo',
    'pisos',
    'pintura'
];


const labels = {

    welcome: '1. Inicio',

    register: '2. Registro',

    login: '3. Login',

    recuperar: '4. Recuperar',

    menu: '5. Menú',

    muro: '6. Muro',

    viga: '7. Viga',

    columna: '8. Columna',

    contrapiso: '9. Contrapiso',

    techo: '10. Techo',

    pisos: '11. Pisos',

    pintura: '12. Pintura'

};


const navStrip = document.getElementById('navStrip');

if (navStrip) {

    screens.forEach(screen => {

        const button = document.createElement('button');

        button.textContent = labels[screen];

        button.id = 'nav-' + screen;

        button.addEventListener('click', () => {

            showScreen(screen);

        });

        navStrip.appendChild(button);

    });

}


function showScreen(name) {

    document.querySelectorAll('.screen').forEach(screen => {

        screen.classList.remove('active');

    });


    const selectedScreen =
        document.getElementById('screen-' + name);


    if (selectedScreen) {

        selectedScreen.classList.add('active');

    }


    document.querySelectorAll('.nav-strip button').forEach(button => {

        button.classList.remove('active');

    });


    const selectedNav =
        document.getElementById('nav-' + name);


    if (selectedNav) {

        selectedNav.classList.add('active');

    }

}


showScreen('welcome');


function fmt(number, decimals = 2) {

    return number.toLocaleString('es-CO', {

        minimumFractionDigits: decimals,

        maximumFractionDigits: decimals

    });

}


function fmtInt(number) {

    return Math.round(number).toLocaleString('es-CO');

}


function cambiarContrasena() {

    const nueva =
        document.getElementById('nuevaContrasena').value;

    const confirmar =
        document.getElementById('confirmarContrasena').value;


    if (nueva === '' || confirmar === '') {

        alert('Por favor completa los dos campos.');

        return;

    }


    if (nueva !== confirmar) {

        alert('Las contraseñas no coinciden.');

        return;

    }


    alert('Contraseña cambiada correctamente.');

    document.getElementById('nuevaContrasena').value = '';

    document.getElementById('confirmarContrasena').value = '';

    showScreen('login');

}


let espesorActual = 20;


function selectEspesor(value) {

    espesorActual = value;


    const esp20 =
        document.getElementById('esp20');

    const esp30 =
        document.getElementById('esp30');


    if (esp20) {

        esp20.classList.toggle(
            'selected',
            value === 20
        );

    }


    if (esp30) {

        esp30.classList.toggle(
            'selected',
            value === 30
        );

    }

}


function calcMuro() {

    const largo =
        parseFloat(
            document.getElementById('muroLargo').value
        ) || 0;


    const alto =
        parseFloat(
            document.getElementById('muroAlto').value
        ) || 0;


    const superficie = largo * alto;


    let cemento;

    let arena;

    let ladrillos;


    if (espesorActual === 30) {

        cemento = superficie * 15.2;

        arena = superficie * 0.115;

        ladrillos = superficie * 120;

    } else {

        cemento = superficie * 10.13;

        arena = superficie * 0.077;

        ladrillos = superficie * 80;

    }


    document.getElementById('muroSup').textContent =
        fmt(superficie) + ' m²';


    document.getElementById('muroCem').textContent =
        fmt(cemento) + ' kg';


    document.getElementById('muroAre').textContent =
        fmt(arena) + ' m³';


    document.getElementById('muroLad').textContent =
        fmtInt(ladrillos) + ' und';


    document.getElementById('muroNote').textContent =
        'Cálculo para muro de ' +
        espesorActual +
        ' cm de espesor';


    document.getElementById('muroResult').style.display =
        'block';

}


function calcViga() {

    const largo =
        parseFloat(
            document.getElementById('vigaLargo').value
        ) || 0;


    document.getElementById('vigaCem').textContent =
        fmt(9 * largo) + ' kg';


    document.getElementById('vigaAre').textContent =
        fmt(0.02 * largo) + ' m³';


    document.getElementById('vigaPie').textContent =
        fmt(0.02 * largo) + ' m³';


    document.getElementById('vigaH8').textContent =
        fmt(4 * largo) + ' m';


    document.getElementById('vigaH4').textContent =
        fmt(3 * largo) + ' m';


    document.getElementById('vigaResult').style.display =
        'block';

}

function calcColumna() {

    const largo =
        parseFloat(
            document.getElementById('colLargo').value
        ) || 0;


    document.getElementById('colCem').textContent =
        fmt(7.5 * largo) + ' kg';


    document.getElementById('colAre').textContent =
        fmt(0.016 * largo, 3) + ' m³';


    document.getElementById('colPie').textContent =
        fmt(0.016 * largo, 3) + ' m³';


    document.getElementById('colH10').textContent =
        fmt(6 * largo) + ' m';


    document.getElementById('colH4').textContent =
        fmt(3 * largo) + ' m';


    document.getElementById('colResult').style.display =
        'block';

}


function calcContrapiso() {

    const espesor =
        (
            parseFloat(
                document.getElementById('cpEspesor').value
            ) || 0
        ) / 100;


    const ancho =
        parseFloat(
            document.getElementById('cpAncho').value
        ) || 0;


    const largo =
        parseFloat(
            document.getElementById('cpLargo').value
        ) || 0;


    const volumen =
        espesor * ancho * largo;


    document.getElementById('cpCem').textContent =
        fmt(78.75 * volumen) + ' kg';


    document.getElementById('cpAre').textContent =
        fmt(0.3375 * volumen, 3) + ' m³';


    document.getElementById('cpPie').textContent =
        fmt(0.675 * volumen, 3) + ' m³';


    document.getElementById('cpResult').style.display =
        'block';

}


function calcTecho() {

    const ancho =
        parseFloat(
            document.getElementById('techoAncho').value
        ) || 0;


    const largo =
        parseFloat(
            document.getElementById('techoLargo').value
        ) || 0;


    const area =
        ancho * largo;


    document.getElementById('techoCem').textContent =
        fmt(6.6 * area) + ' kg';


    document.getElementById('techoAre').textContent =
        fmt(0.0144 * area, 3) + ' m³';


    document.getElementById('techoPie').textContent =
        fmt(0.0144 * area, 3) + ' m³';


    document.getElementById('techoH8').textContent =
        fmt(1.4 * area) + ' m';


    document.getElementById('techoH6').textContent =
        fmt(0.667 * area) + ' m';


    document.getElementById('techoResult').style.display =
        'block';

}


function calcPisos() {

    const ancho =
        parseFloat(
            document.getElementById('pisoAncho').value
        ) || 0;


    const largo =
        parseFloat(
            document.getElementById('pisoLargo').value
        ) || 0;


    const superficie =
        ancho * largo;


    const adicional =
        superficie * 0.10;


    const total =
        superficie + adicional;


    document.getElementById('pisoSup').textContent =
        fmt(superficie) + ' m²';


    document.getElementById('pisoExtra').textContent =
        fmt(adicional) + ' m²';


    document.getElementById('pisoTotal').textContent =
        'Superficie total a cubrir ' +
        fmt(total) +
        ' m²';


    document.getElementById('pisoResult').style.display =
        'block';

}


function calcPintura() {

    const superficie =
        parseFloat(
            document.getElementById('pinturaSup').value
        ) || 0;


    const litros =
        superficie / 6;


    document.getElementById('pinturaLitros').textContent =
        fmt(litros) + ' litros';


    document.getElementById('pinturaResult').style.display =
        'block';

}