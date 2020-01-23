function floatType(value, donnee) {
    if (donnee == "temperature") {
        return (value).toFixed(2) + " C";
    }
    else if (donnee == "humidite") {
        return (value).toFixed(2) + " %";
    }
    else if (donnee == "luminosite") {
        return (value).toFixed(2) + " lux";
    }
    else if (donnee == "uv") {
        return (value).toFixed(2);
    }
}

function renderChart(data, labels, donnee, titre) {
    var ctx = document.getElementById("myChart").getContext('2d');
    var myChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: titre,
                    data: data[0],
                    borderColor: 'rgb(250,0,0)',
                    backgroundColor: 'rgba(250,0,0,0.2)',
                }
            ]
        },
        options: {
            scales: {
                yAxes: [{
                    ticks: {
                        beginAtZero: false,
                        callback: function (value, index, values) {
                            return floatType(value,donnee);
                        }
                    }
                }]
            },
            title: {
                text: titre.toUpperCase()
            }
        }
    });
}

function getChartData(donnee, titre, capteur) {
    $.ajax({
        url: "http://192.168.137.75:3000/api",
        success: function (result) {
            var data = [];
            console.log(result[capteur][donnee]);
            data.push(result[capteur][donnee]);
            var dates = [];
            result[capteur].date.map(function (date) {
                var dateObject = new Date(date);
                var heure = dateObject.getDate() + "/" + dateObject.getMonth()+1 + " " + dateObject.getHours() + ":" + dateObject.getMinutes();
                dates.push(heure);
            })
            var labels = dates;
            renderChart(data, labels, donnee, titre);
        },
        error: function (err) {
            $("#loadingMessage").html("Error");
        }
    });
}
var titre = window.location.search.replace("&radio=", " ").replace("?capteur=", "").replace("capteur", "capteur ");
var donnee = window.location.search.replace("&radio=", "").replace("?capteur=capteur1", "").replace("?capteur=capteur2", "");
var capteur = titre.replace(" temperature", "").replace(" humidite", "").replace(" uv", "").replace(" luminosite", "").replace("capteur ", "capteur");

getChartData(donnee, titre, capteur);

//Title Configuration
Chart.defaults.global.title.display = true;
Chart.defaults.global.title.fontSize = 25;
Chart.defaults.global.title.fontFamily = 'Arial';
Chart.defaults.global.title.text = "Temperature";
Chart.defaults.global.title.fontColor = '#000000';

//Legend
Chart.defaults.global.legend.display = false;
/*Chart.defaults.global.legend.position = 'bottom';
Chart.defaults.global.legend.align = 'center';
Chart.defaults.global.legend.fullWidth = true;
//Chart.defaults.global.legend.onClick = ;
//Chart.defaults.global.legend.onHover = ;
//Chart.defaults.global.legend.onLeave = ;
Chart.defaults.global.legend.reverse = false;
Chart.defaults.global.legend.rtl = false;
//Chart.defaults.global.legend.textDirection =;
//Chart.defaults.global.legend.labels = ;
Chart.defaults.global.legend.labels.boxWidth = 40;
Chart.defaults.global.legend.labels.fontSize = 12;
Chart.defaults.global.legend.labels.fontStyle = 'normal';
Chart.defaults.global.legend.labels.fontColor = '#666';
Chart.defaults.global.legend.labels.fontFamily = 'Arial';
Chart.defaults.global.legend.labels.padding = 10;
//Chart.defaults.global.legend.labels.generateLabels = null;
//Chart.defaults.global.legend.labels.filter = null;
//Chart.defaults.global.legend.labels.usePointStyle = false;
*/