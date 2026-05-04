var panoElements = document.getElementById("pano");

var pasreizejaAina = null;

var skatitajsOpcijas = {
  controls: {
    mouseViewMode: "drag"
  }
};

var skatitajs = new Marzipano.Viewer(panoElements, skatitajsOpcijas);

var THRESHOLD = 0.3;

// Attēlu uzskaitījums
var bildes = [
  { nosaukums: "402gaitenis",
    bilde: "panorama_images/402gaitenis.jpeg",
    bultas: [
      { uz: "403gaitenis", yaw:  1.33, pitch: 0.3, entryYaw: 2.08 },
      { uz: "atp_telpa_gaitenis", yaw:  -1.9, pitch: 0.34, entryYaw:0.18 }],
    info: { teksts: "Šajā kabinetā notiek programmēšanas mācību stundas.", yaw: -0.26, pitch: 0.25}
  },
  { nosaukums: "403gaitenis",
    bilde: "panorama_images/403gaitenis.jpeg",
    bultas: [
      { uz: "402gaitenis", yaw:  -0.96, pitch: 0.48, entryYaw: -1.92 },
      { uz: "ieeja_gaitenis", yaw:  2.05, pitch: 0.41, entryYaw:0.75 }],
    info: { teksts: "Šajā kabinetā notiek matemātikas, ķīmijas, uzņēmējdarbības, kultūras pamatu un tehniskās grafikas mācību stundas.", yaw: 0.46, pitch: 0.16}
  },
  { nosaukums: "atp_telpa2",
    bilde: "panorama_images/atp_telpa2.jpeg",
    bultas: [
      { uz: "atp_telpa1", yaw: 0.38, pitch: 0.12, entryYaw: -0.5 }],
    info: { teksts: "Šī ir skolēnu atpūtas telpa, kurā skolēni pavada savu brīvo laiku.", yaw: -0.32, pitch: 0.06}
  },
  { nosaukums: "atp_telpa1",
    bilde: "panorama_images/atp_telpa1.jpeg",
    bultas: [
      { uz: "atp_telpa2", yaw:  2.78, pitch: 0.12, entryYaw: -2.74 },
      { uz: "atp_telpa_gaitenis", yaw:  -1.87, pitch: 0.24,entryYaw: 1.73 }],
    info: { teksts: "Šī ir skolēnu atpūtas telpa, kurā skolēni pavada savu brīvo laiku.", yaw: -3.06, pitch: 0.14}
  },
  { nosaukums: "atp_telpa_gaitenis",
    bilde: "panorama_images/atp_telpa_gaitenis.jpeg",
    bultas: [
      { uz: "atp_telpa1", yaw: -1.19, pitch: 0.3, entryYaw: 1.08},
      { uz: "402gaitenis", yaw: -2.96, pitch: 0.43, entryYaw: 1.26 },
      { uz: "zale1", yaw:  0.23, pitch: 0.34, entryYaw: 0.53}
    ]
  },
  { nosaukums: "gaitenis2",
    bilde: "panorama_images/gaitenis2.jpeg",
    bultas: [
      { uz: "ieeja_gaitenis", yaw: -2.08, pitch: 0.39, entryYaw: -0.84 }
    ]
  },
  { nosaukums: "ieeja",
    bilde: "panorama_images/ieeja.jpeg",
    bultas: [
      { uz: "ieeja_gaitenis", yaw: -0.68, pitch: 0.54, entryYaw: 2.93 }],
    info: { teksts: "Esiet sveicināti RTU Inženierzinātņu vidusskolas virtuālajā tūrē.", yaw: -0.59, pitch: 0.18}
  },
  { nosaukums: "ieeja_gaitenis",
    bilde: "panorama_images/ieeja_gaitenis.jpeg",
    bultas: [
      { uz: "403gaitenis", yaw: -2.21, pitch: 0.37, entryYaw: -1.14},
      { uz: "ieeja", yaw:  -1, pitch: 0.44, entryYaw: 2.11 },
      { uz: "gaitenis2", yaw:  2.13, pitch: 0.35, entryYaw: 1.17 }
    ]
  },
  { nosaukums: "zale1",
    bilde: "panorama_images/zale1.jpeg",
    bultas: [
      { uz: "zale2", yaw:  1.11, pitch: 0.25, entryYaw: -2.76 },
      { uz: "atp_telpa_gaitenis", yaw:  -2.28, pitch: 0.33, entryYaw:-3.02 }],
    info: { teksts: "Šī ir skolas pasākumu zāle.", yaw: 0.55, pitch: 0.22}
  },
  { nosaukums: "zale2",
    bilde: "panorama_images/zale2.jpeg",
    bultas: [
      { uz: "zale1", yaw: 0.38, pitch: 0.15, entryYaw:-2.25 }],
    info: { teksts: "Šī ir skolas pasākumu zāle.", yaw: 1.38, pitch: 0.17}
  }
];

document.addEventListener('wheel', function(e) {
  e.preventDefault();
  var skats = skatitajs.scene() && skatitajs.scene().view();
  if (!skats) return;

  skats._limiter = null;

  var jaunsFov = skats.fov() + (e.deltaY > 0 ? 0.1 : -0.1);
  jaunsFov = Math.max(0.3, Math.min(1.7, jaunsFov));

  skats.setParameters({ fov: jaunsFov });

}, { passive: false });

var ainas = {};

// Katras ainas izveide
bildes.forEach(function(item) {
  var attelaAvots = Marzipano.ImageUrlSource.fromString(item.bilde);
  var izmers = new Marzipano.EquirectGeometry([{ width: 3584 }]);
  var skats = new Marzipano.RectilinearView(
    { yaw: 0, pitch: 0, fov: 1.4 }
  );

  ainas[item.nosaukums] = skatitajs.createScene({
    source: attelaAvots,
    geometry: izmers,
    view: skats
  });
});

var overlay = document.getElementById('overlay');
var overlayBultas = [];
var tekstlodzini = [];

bildes.forEach(function(item) {
  item.bultas.forEach(function(link) {

    var bulta = document.createElement('img');

    bulta.src = 'bultina.png';
    bulta.classList.add('bulta-overlay');
    bulta.style.left = '50%';
    bulta.style.top = '60%';
    bulta.style.transform = 'translate(-50%, -50%)';
    bulta.addEventListener('click', function() {
      mainitAinu(link.uz, link.entryYaw);
    });

    overlay.appendChild(bulta);
    overlayBultas.push({
      elements : bulta,
      yaw: link.yaw,
      pitch: link.pitch,
      ainasNosaukums: item.nosaukums
    });
  });
  if (item.info) {
    var link = item.info;
    var tekstlodzins = document.createElement('img');
    tekstlodzins.src = 'info.jpg';
    tekstlodzins.classList.add('tekstlodzini')
    tekstlodzins.addEventListener('click', function() {
          raditTekstlodzinu(link.teksts);
        });
    overlay.appendChild(tekstlodzins);
        tekstlodzini.push({
          elements : tekstlodzins,
          yaw: link.yaw,
          pitch: link.pitch,
          ainasNosaukums: item.nosaukums
        });
  }
});

function attalums(yaw1, pitch1, yaw2, pitch2) {
  var dy = yaw1 - yaw2;
  var dp = pitch1 - pitch2;
  return Math.sqrt(dy * dy + dp * dp);
}

function atjaunotBultinas() {

  if (!pasreizejaAina || !ainas[pasreizejaAina]) return;
  var skats = ainas[pasreizejaAina].view();
  var parametri = skats.parameters();
  overlayBultas.forEach(function(item) {
    if (item.ainasNosaukums !== pasreizejaAina) {
      item.elements.classList.remove('aktivs');
      return;
    }
    var dist = attalums(parametri.yaw, parametri.pitch, item.yaw, item.pitch);
        item.elements.classList.toggle('aktivs', dist < THRESHOLD);
  });
  tekstlodzini.forEach(function(item) {
      if (item.ainasNosaukums !== pasreizejaAina) {
        item.elements.classList.remove('aktivs');
        return;
      }
      var dist = attalums(parametri.yaw, parametri.pitch, item.yaw, item.pitch);
      item.elements.classList.toggle('aktivs', dist < THRESHOLD);
  });
}

function raditTekstlodzinu(teksts) {
  var paslaik = document.getElementById('tekstlodzini1');
  if (paslaik) paslaik.remove();

  var popup = document.createElement('div');
  popup.id = 'tekstlodzini1';
  popup.innerHTML = '<p>' + teksts + '</p>';
  document.body.appendChild(popup);

}

// Ainas maiņa
function mainitAinu(nosaukums, entryYaw) {

  if (!ainas[nosaukums] || nosaukums === pasreizejaAina) return;
  pasreizejaAina = nosaukums;
  minimapIzcelt(nosaukums);
  var paslaik = document.getElementById('tekstlodzini1');
  if (paslaik) paslaik.remove();
  ainas[nosaukums].switchTo({ transitionDuration: 500 });
  ainas[nosaukums].view()._limiter = null;
  ainas[nosaukums].view().setParameters({
    yaw: entryYaw !== undefined ? entryYaw : 0,
    pitch: 0,
    fov: 1.4
  });
  ainas[nosaukums].view().addEventListener('change', atjaunotBultinas);
  atjaunotBultinas();
}

function minimapKlikskis(nosaukums) {
  mainitAinu(nosaukums);
}

function minimapIzcelt(nosaukums) {
  document.querySelectorAll('.mdot').forEach(function(el) {
    el.classList.remove('active');
  });

  var el = document.getElementById('md-' + nosaukums);
  if (el) el.classList.add('active');
}

function parslegtMinimap() {
  var body = document.getElementById('minimap-body');
  var poga = document.querySelector('#minimap-header button');

  var paslepts = body.classList.toggle('hidden');

  poga.textContent = paslepts ? 'show' : 'hide';
}

/*window.addEventListener('keydown', function(e) {
  if (e.key === 'd' || e.key === 'D') {

    var skats = ainas[pasreizejaAina].view();
    var parametri = skats.parameters();

    console.log(
      pasreizejaAina,
      '→ yaw:',   parametri.yaw.toFixed(2),
      '  pitch:', parametri.pitch.toFixed(2)
    );
  }
});
*/
// Palaišana
mainitAinu("ieeja");
requestAnimationFrame(atjaunotBultinas);