var panoElement = document.getElementById("pano");

var tagadejaAina = null;

var viewerOpts = {
  controls: {
    mouseViewMode: "drag"
  }
};

var viewer = new Marzipano.Viewer(panoElement, viewerOpts);

//FOV limiti, nezinu, kāpēc zoom bieži nestrādā.
var limiti = Marzipano.RectilinearView.limit.traditional(
  120 * Math.PI / 180,  // max FOV
  90  * Math.PI / 180   // min FOV
);


var THRESHOLD = 0.3;
//Attēlu uzskaitījums, yaw - horizontālais leņķis radiānos. pitch - vertikālais leņķis radiānos.
var bildes = [
  { nosaukums: "402gaitenis",
    bilde: "panorama_images/402gaitenis.jpeg",
    bultas: [
      { uz: "403gaitenis", yaw:  1.33, pitch: 0.3 },
      { uz: "atp_telpa_gaitenis", yaw:  -1.9, pitch: 0.34 }
    ]
  },
  { nosaukums: "403gaitenis",
    bilde: "panorama_images/403gaitenis.jpeg",
    bultas: [
      { uz: "402gaitenis", yaw:  -0.96, pitch: 0.48 },
      { uz: "ieeja_gaitenis", yaw:  2.05, pitch: 0.41 }
    ]
  },
  { nosaukums: "atp_telpa2",
    bilde: "panorama_images/atp_telpa2.jpeg",
    bultas: [
      { uz: "atp_telpa1", yaw: 0.38, pitch: 0.12 }
    ]
  },
  { nosaukums: "atp_telpa1",
    bilde: "panorama_images/atp_telpa1.jpeg",
    bultas: [
      { uz: "atp_telpa2", yaw:  2.78, pitch: 0.12 },
      { uz: "atp_telpa_gaitenis", yaw:  -1.87, pitch: 0.24 }
    ]
  },
  { nosaukums: "atp_telpa_gaitenis",
    bilde: "panorama_images/atp_telpa_gaitenis.jpeg",
    bultas: [
      { uz: "atp_telpa1", yaw: -1.19, pitch: 0.3 },
      { uz: "402gaitenis", yaw: -2.96, pitch: 0.43 },
      { uz: "zale1", yaw:  0.23, pitch: 0.34 }
    ]
  },
  { nosaukums: "gaitenis2",
    bilde: "panorama_images/gaitenis2.jpeg",
    bultas: [
      { uz: "ieeja_gaitenis", yaw: -2.08, pitch: 0.39 }
    ]
  },
  { nosaukums: "ieeja",
    bilde: "panorama_images/ieeja.jpeg",
    bultas: [
      { uz: "ieeja_gaitenis", yaw: -0.68, pitch: 0.54 }
    ]
  },
  { nosaukums: "ieeja_gaitenis",
    bilde: "panorama_images/ieeja_gaitenis.jpeg",
    bultas: [
      { uz: "403gaitenis", yaw: -2.21, pitch: 0.37 },
      { uz: "ieeja", yaw:  -1, pitch: 0.44 },
      { uz: "gaitenis2", yaw:  2.13, pitch: 0.35 }
    ]
  },
  { nosaukums: "zale1",
    bilde: "panorama_images/zale1.jpeg",
    bultas: [
      { uz: "zale2", yaw:  1.11, pitch: 0.25 },
      { uz: "atp_telpa_gaitenis", yaw:  -2.28, pitch: 0.33 }
    ]
  },
  { nosaukums: "zale2",
    bilde: "panorama_images/zale2.jpeg",
    bultas: [
      { uz: "zale1", yaw: 0.38, pitch: 0.15 }
    ]
  }
];
/*
var info = [
    {nosaukums:"atp_telpa",
     teksts: "Šī ir skolēnu atpūtas telpa.", yaw = 0, pitch = 0},
    {nosaukums:"zale",
     teksts: "Šī ir skolas lielā zāle.", yaw = 0, pitch = 0},
    {nosaukums:"ieeja",
     teksts: "Esiet sveicināti RTU IZV telpās!", yaw = 0, pitch = 0}]
*/

var ainas = {};
//Katra attēla skata izveidošana.
bildes.forEach(function(item) {
  var attels = Marzipano.ImageUrlSource.fromString(item.bilde);
  var platums = new Marzipano.EquirectGeometry([{ width: 3584 }]);
  var skats = new Marzipano.RectilinearView(
    { yaw: 0, pitch: 0, fov: 1.4 },
    limiti
  );

  ainas[item.nosaukums] = viewer.createScene({
    source: attels,
    geometry: platums,
    view: skats
  });
});


var overlay = document.getElementById('overlay');
var overlayBultas = [];

bildes.forEach(function(item) {
  item.bultas.forEach(function(link) {
    var bulta = document.createElement('img');
    bulta.src = 'bultina.png';
    bulta.classList.add('bulta-overlay');

    bulta.style.left = '50%';
    bulta.style.top = '60%';
    bulta.style.transform = 'translate(-50%, -50%)';

    bulta.addEventListener('click', function() {
      switchScene(link.uz);
    });

    overlay.appendChild(bulta);

    overlayBultas.push({
      el: bulta,
      yaw: link.yaw,
      pitch: link.pitch,
      ainasNosaukums: item.nosaukums
    });
  });
});

//Funkcija, kas pārbauda, kur skatās lietotājs. Ja iegūtā vērtība ir <0.3, tad tiek parādīta viena no bultiņām.
function attalums(yaw1, pitch1, yaw2, pitch2) {
  var dy = yaw1 - yaw2;
  var dp = pitch1 - pitch2;
  return Math.sqrt(dy * dy + dp * dp);
}

//Katram skatam atjauno redzamās bultiņas (bez šī visas bultiņas parādītos vienlaicīgi un būtu redzamas katrā attēlā;
function atjaunotBultinas() {
  if (tagadejaAina && ainas[tagadejaAina]) {
    var view = ainas[tagadejaAina].view();
    var pmeters = view.parameters();

    overlayBultas.forEach(function(item) {
      if (item.ainasNosaukums !== tagadejaAina) {
        item.el.classList.remove('aktivs');
        return;
      }

      var dist = attalums(pmeters.yaw, pmeters.pitch, item.yaw, item.pitch);
      item.el.classList.toggle('aktivs', dist < THRESHOLD);
    });
  }

  requestAnimationFrame(atjaunotBultinas);
}

//Pārejas.


function mainitAinu(nosaukums) {
  if (!ainas[nosaukums] || nosaukums === tagadejaAina) return;
  tagadejaAina = nosaukums;
  ainas[nosaukums].switchTo({ transitionDuration: 500 });
}

//Šī daļa tika izmantota, lai noteiktu yaw un pitch vērtības, lai precīzāk atzīmētu bultiņu atrašanās vietas.
/*
window.addEventListener('keydown', function(e) {
  if (e.key === 'd' || e.key === 'D') {
    var view = ainas[currentScene].view();
    var pmeters = view.parameters();
    console.log(
      currentScene,
      '→ yaw:',   pmeters.yaw.toFixed(2),
      '  pitch:', pmeters.pitch.toFixed(2)
    );
  }
});
*/

// Palaišana.
switchScene("ieeja");
requestAnimationFrame(atjaunotBultinas);




