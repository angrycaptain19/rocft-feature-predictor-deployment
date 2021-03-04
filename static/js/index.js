
$(document).ready(function(){
    var clic=false;
    var xCoord,yCoord="";
    var canvas=document.getElementById("can");
    var cntx=canvas.getContext("2d");
    cntx.strokeStyle="black";
    cntx.lineWidth=3;
    cntx.lineCap="round";
    cntx.fillStyle="#fff";
    cntx.fillRect(0,0,canvas.width,canvas.height);

    var points = []

    // var responseJSON = null

    var responseJSON = {};
    var targetProxy = new Proxy(responseJSON, {
      set: function (target, key, value) {
          console.log(`${key} set to ${value}`);
          document.getElementById(`${key}`).innerHTML = `${value[0]} &emsp;&emsp;&emsp; - &emsp;&emsp;&emsp; ${value[1]}`
          target[key] = value;
          return true;
      }
    });

    w = 600;
    h = 600;

    function toblob(stuff) {
        var g, type, bi, ab, ua, b, i;
        g = stuff.split(',');
        if (g[0].split('png')[1])
            type = 'png';
        else if (g[0].split('jpeg')[1])
            type = 'jpeg';
        else
            return false;
        bi = atob(g[1]);
        ab = new ArrayBuffer(bi.length);
        ua = new Uint8Array(ab);
        for (i = 0; i < bi.length; i++) {
            ua[i] = bi.charCodeAt(i);
        }
        b = new Blob([ua], {
            type: "image/" + type
        });
        return b;
    }

    feature_map = {
        1: "Cross, Upper left corner, outside rectangle",
        2: "Large Rectangle",
        3: "Diagonal Cross",
        4: "Horizontal midline of 2",
        5: "Vertical Midline",
        6: "Small rectangle within 2 to the left",
        7: "Small segment above 6",
        8: "Four parallel lines within 2, upper left",
        9: "Triangle above 2, upper right",
        10: "Small vertical line within 2, below 9",
        11: "Circle with three dots within 2",
        12: "Five parallel lines within 2, crossing 3, lower right",
        13: "Side of triangle attached to 2 on right",
        14: "Diamond attached to 13",
        15: "Vertical line within 13, parallel to right vertical of 2",
        16: "Horizontal line within 13, continuing 4 to the right",
        17: "Cross attached to low center",
        18: "Square attached to 2, lower left"
    }

    var size_offset = 600

    var history = {
        redo_list: [],
        undo_list: [],
        saveState: function(canvas, list, keep_redo) {
            keep_redo = keep_redo || false;
            if(!keep_redo) {
            this.redo_list = [];
            }
            
            (list || this.undo_list).push(canvas.toDataURL());   
        },
        undo: function(canvas, cntx) {
            this.restoreState(canvas, cntx, this.undo_list, this.redo_list);
        },
        redo: function(canvas, cntx) {
            this.restoreState(canvas, cntx, this.redo_list, this.undo_list);
        },
        restoreState: function(canvas, cntx,  pop, push) {
            if(pop.length) {
                this.saveState(canvas, push, true);
                var restore_state = pop.pop();
                // var img = new Element('img', {'src':restore_state});
                var img = document.createElement('img'); 
                img.src =  restore_state
                img.onload = function() {
                    cntx.clearRect(0, 0, 600, 400);
                    cntx.drawImage(img, 0, 0, 600, 400, 0, 0, 600, 400);  
                }
            }
        }
    }

    function sigmoid(t) {
        return 1/(1+Math.pow(Math.E, -t));
    }


    $("#can").bind('touchstart mousedown', function(canvas){
        canvas.preventDefault()
        clic=true;
        cntx.save();
        xCoord=canvas.pageX-this.offsetLeft;
        yCoord=canvas.pageY-this.offsetTop;
        var canvas2 = document.getElementById("can");
        history.saveState(canvas2);
        points.length = 0
        points.push({x: xCoord, y: yCoord})
        // console.log(canvas.type)
        cntx.moveTo(xCoord, yCoord)
    });

    $(document).bind('touchend touchleave mouseup', function(canvas){
        canvas.preventDefault()

        if(clic==true && canvas.type == 'mouseup'){
            xCoord=canvas.pageX-this.offsetLeft;
            yCoord=canvas.pageY-this.offsetTop;

            points.push({x: xCoord, y: yCoord})
        }

        else if(clic==true && (canvas.type == 'touchend' || canvas.type == 'touchleave') ){
            xCoord=canvas.pageX-this.offsetLeft;
            yCoord=canvas.pageY-this.offsetTop;

            points.push({x: xCoord, y: yCoord})
        }

        if (points.length >= 3) {
            const l = points.length - 1
            cntx.quadraticCurveTo(points[l].x, points[l].y, xCoord, yCoord)
            cntx.stroke()
        }

        points.length = 0

        // updatePredictions()
        clic=false
    });

    $(document).click(function(){
        clic=false
    });

    $("#can").bind('touchmove mousemove', function(canvas){
        canvas.preventDefault()
        if(clic==true && canvas.type == 'mousemove'){
            xCoord=canvas.pageX-this.offsetLeft;
            yCoord=canvas.pageY-this.offsetTop;

            points.push({x: xCoord, y: yCoord})
        }
        else if(clic==true && canvas.type == 'touchmove'){
            xCoord=canvas.originalEvent.touches[0].pageX-this.offsetLeft;
            yCoord=canvas.originalEvent.touches[0].pageY-this.offsetTop;

            points.push({x: xCoord, y: yCoord})
        }
        // console.log("AFTER: ", points[points.length - 1])

        if (points.length >= 3) {
            const l = points.length - 1
            const xc = (points[l].x + points[l - 1].x) / 2
            const yc = (points[l].y + points[l - 1].y) / 2
            // cntx.lineWidth = points[l - 1].lineWidth

            cntx.quadraticCurveTo(points[l - 1].x, points[l - 1].y, xc, yc)
            cntx.stroke()
            cntx.beginPath()
            cntx.moveTo(xc, yc)
        }
    });

                
    $("#borrador").bind('click touchstart', function(){
        cntx.strokeStyle="#fff";
        cntx.lineWidth=10;
    });


    $("#limpiar").bind('click touchstart', function(){
        cntx.fillStyle="#fff";
        cntx.fillRect(0,0,canvas.width, canvas.height);
        cntx.strokeStyle="black";
        cntx.lineWidth=3;
    });
    $("#download").bind('click touchstart', function(){
        console.log("in predict")
        var canvas = document.getElementById("can");
        var dataURL    = canvas.toDataURL("image/png");

        document.getElementById('data').value = dataURL;
        var fd = new FormData(document.forms["form1"]);


        var xhr = new XMLHttpRequest({mozSystem: true});
        xhr.open('POST', `http://${window.location.host}/predict`, true);
        // xhr.responseType = 'json';

        xhr.onreadystatechange = function () {
            if (xhr.readyState == XMLHttpRequest.DONE) {

                // document.getElementById('num').innerHTML = xhr.responseText;
                var responseText = JSON.parse(xhr.responseText); 
                for (const [key, value] of Object.entries(responseText)) {
                    // console.log(`${key}: ${value}`);
                    targetProxy[key] = value
                }
                
            }
        }

        xhr.onload = function() {
 
        };
        xhr.send(fd);

        // document.write('<img src="'+img+'"/>');
    });
    $("#undo").bind('click touchstart', function(){
        history.undo(canvas, cntx);
    });
    $("#redo").bind('click touchstart', function(){
        history.redo(canvas, cntx);
    });
    })
