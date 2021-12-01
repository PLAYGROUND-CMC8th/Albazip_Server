
module.exports = {
    subtract:  (start, end) => {

        let minus = false;
        if(start > end){
            [start, end] = [end, start];
            minus = true;
        }


        let startHour = Number(start.substring(0,2));
        let startMin = Number(start.substring(2,4));

        let endHour = Number(end.substring(0,2));
        let endMin = Number(end.substring(2,4));

        if( startMin > endMin ){
            endMin += 60;
            endHour -= 1;
        }

        const result = String(endHour - startHour).padStart(2, '0') + String(endMin - startMin).padStart(2,'0');

        if(minus) return "-"+result;
        else return result;
    }
};