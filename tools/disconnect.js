module.exports = (io, kinect) => {
    const disconnect = function () {
        const socket = this;
        kinect.removeAllListeners('bodyFrame')
        kinect.close();
    };
    return {
        disconnect,
    }
}