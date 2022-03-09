let offset = 0.05;
let have_dist = false;

function findDistWall(kinect) 
{
    return new Promise((resolve, reject) => 
    {
        let distWall = [];    
        kinect.on('bodyFrame', function(bodyFrame){
            if(!have_dist){
                for(var i = 0;  i < bodyFrame.bodies.length; i++) {
                    if (bodyFrame.bodies[i].tracked) {
                        distWall.push(bodyFrame.bodies[i].joints[3].cameraZ)
                        console.log("track");
                    }
                }
            }

        });
            
        kinect.openBodyReader()

        setTimeout(function(){
            if(distWall.length > 10) {
                kinect.closeBodyReader().then(()=>{
                    resolve(numAverage(distWall));
                });
            } else {
                kinect.closeBodyReader().then(()=>{
                    reject()
                });
            }
        },5000);
    });
}

function numAverage(a) {
    let b = a.length,
    c = 0, i;
    for (i = 0; i < b; i++){
      c += Number(a[i]);
    }
    return c/b;
}

module.exports = (io,kinect) => {

    const touch = async function() {
        const socket = this;
        if (kinect.open()) {
            let avgDist
            avgDist = await findDistWall(kinect).catch((e)=>{
                console.log("fuck")
            });                

            // have_dist = true;
            // kinect.on('bodyFrame',function (bodyFrame) {
            //     let nb_peoples = 0;
            //     let personnes = [];
            //     let response;
                    
            //     for(var i = 0;  i < bodyFrame.bodies.length; i++) {
            //         if (bodyFrame.bodies[i].tracked && (bodyFrame.bodies[i].joints[7].cameraZ >= avgDist-offset  || bodyFrame.bodies[i].joints[11].cameraZ >= avgDist-offset)) {
            //             nb_peoples++
            //             response = {"nb_peoples": nb_peoples}
            //             let people = {}                            
            //             if(bodyFrame.bodies[i].joints[7].cameraZ >= avgDist-offset){
            //                 people["left_hand"] = {
            //                     "x": bodyFrame.bodies[i].joints[7].colorX,
            //                     "y": bodyFrame.bodies[i].joints[7].colorY,
            //                 }
            //             }

            //             if(bodyFrame.bodies[i].joints[11].cameraZ >= avgDist-offset){
            //                 people["right_hand"] = {
            //                     "x": bodyFrame.bodies[i].joints[11].colorX,
            //                     "y": bodyFrame.bodies[i].joints[11].colorY,
            //                 }
            //             }
            //             personnes.push(people)
            //         }
            //     }
            //     response["peoples"] = personnes
            //     if(response)  {
            //         socket.emit('touch',response)
            //     }
            // });
            // kinect.openBodyReader();
        } else {
            console.log("Kinect could not be openend");
        } 
    };
    return {touch}
}