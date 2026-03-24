let select = e => document.querySelector(e);
let selectAll = e => document.querySelectorAll(e);


document.querySelectorAll('input[name="answer1"]').forEach((elem) => {

    elem.addEventListener("change", function(event) {
        var answer = event.target.value;
        select("body").setAttribute("data-type",answer);
        changeDataType(answer);
        changeRadioAnswer("2",answer);
    })

});

document.querySelectorAll('input[name="answer2"]').forEach((elem) => {

    elem.addEventListener("change", function(event) {
        var answer = event.target.value;
        select("body").setAttribute("data-type",answer);
        changeDataType(answer);
        changeRadioAnswer("1",answer);
    })

});

function changeDataType(answer) {

    if( ( answer == "yes") || ( answer == "no") )
    {
        select("#fw1").setAttribute("data-type",answer);
        select("#fw2").setAttribute("data-type",answer);
    }
    else
    {
        select("#fw1").setAttribute("data-type","maybe");
        select("#fw2").setAttribute("data-type","maybe");
    }

}
function changeRadioAnswer(radio,answer) {

    selectAll("#fw"+radio+ " input").forEach((elem) => {

        if( elem.getAttribute("value") == answer )
            elem.checked = true;
        else
            elem.checked = false;

    });

}