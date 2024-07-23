'use strict';

import { KM_PER_AU } from "./constants.js";
import { Vector3 } from "three";
import { vsop87_data } from "./solar_system_data.js";

function sumSeries(series, t) {
    let x = 0.0;
    for (const term of series) {
        x += term[0] * Math.cos(term[1] + term[2] * t);
    }
    return x;
}

function calcPositionLBR(jd, seriesLBR) {
    let t = (jd - 2451545.0) / 365250.0;

    let l = 0.0, b = 0.0, r = 0.0;
    let T;

    T = 1;
    for (const series of seriesLBR.L) {
        l += sumSeries(series, t) * T;
        T = t * T;
    }

    T = 1;
    for (const series of seriesLBR.B) {
        b += sumSeries(series, t) * T;
        T = t * T;
    }

    T = 1;
    for (const series of seriesLBR.R) {
        r += sumSeries(series, t) * T;
        T = t * T;
    }

    return new Vector3(
        Math.cos(l) * Math.cos(b) * r,
        Math.sin(l) * Math.cos(b) * r,
        Math.sin(b) * r
    );
}

class Orbit {
    constructor() { }

    positionAtTime(jd) {
        throw new Error("positionAtTime() must be implemented by subclass.");
    }

    orbitAtTime(jd) {
        throw new Error("orbitAtTime() must be implemented by subclass.");
    }
}

class SunOrbit extends Orbit {
    constructor() {
        super();
    }

    // always at the origin
    positionAtTime(jd) {
        return new Vector3();
    }

    orbitAtTime(jd) {
        const orbitPoints = [];
        // const numPoints = 1000;
        // const dt = 365 / numPoints;
        // for (let i = 0; i < numPoints; i++) {
        //     const jd1 = jd + i * dt;
        //     orbitPoints.push(this.positionAtTime(jd1));
        // }
        return orbitPoints;
    }

    orbitCurve() {
        return [];
    }
}

class EarthOrbit extends Orbit {

    #orbitPoints = [];
    #numPoints = 1000;
    #total = 365.6;
    #dt = this.#total / this.#numPoints;
    #prevHead;
    #prevTail;
    #lastTime;

    rangeLow = this.#numPoints * -0.3;
    rangeHigh = this.#numPoints * 0.7;

    constructor() {
        super();
        this.orbitData = vsop87_data.earth;
    }

    // relative to sun's body center
    positionAtTime(jd) {
        return calcPositionLBR(jd, this.orbitData);
    }

    orbitAtTime(jd) {
        const orbitPoints = [];
        for (let i = this.rangeLow; i < this.rangeHigh; i++) {
            const jd1 = jd + i * this.#dt;
            orbitPoints.push(this.positionAtTime(jd1));
        }
        this.#prevHead = jd + this.rangeLow * this.#dt;
        this.#prevTail = jd + this.rangeHigh * this.#dt;
        this.#lastTime = jd;
        return orbitPoints;
    }

    orbitCurve(jd) {
        if (this.#orbitPoints.length === 0) {
            this.#orbitPoints = this.orbitAtTime(jd);
        } else if (Math.abs(jd - this.#lastTime) > this.#total / 3) {
            this.#orbitPoints = this.orbitAtTime(jd);
        } else {
            if (jd > this.#lastTime) {
                const now_head = jd + this.rangeLow * this.#dt;
                // const now_tail = jd + this.range_high * this.#dt;
                while (this.#prevHead < now_head) {
                    this.#orbitPoints.shift();
                    this.#prevHead += this.#dt;
                }
                while (this.#orbitPoints.length < this.rangeHigh - this.rangeLow) {
                    this.#orbitPoints.push(this.positionAtTime(this.#prevTail));
                    this.#prevTail += this.#dt;
                }

            } else if (jd < this.#lastTime) {
                const now_tail = jd + this.rangeHigh * this.#dt;
                while (this.#prevTail > now_tail) {
                    this.#orbitPoints.pop();
                    this.#prevTail -= this.#dt;
                }
                while (this.#orbitPoints.length < this.rangeHigh - this.rangeLow) {
                    this.#orbitPoints.unshift(this.positionAtTime(this.#prevHead - this.#dt));
                    this.#prevHead -= this.#dt;
                }
            }
        }
        this.#lastTime = jd;
        const PointsCopy = this.#orbitPoints.slice();
        return PointsCopy;
    }

}

class MoonOrbit extends Orbit {

    #orbitPoints = [];
    #numPoints = 500;
    #total = 27.32;
    #dt = this.#total / this.#numPoints;
    #prevHead;
    #prevTail;
    #lastTime;

    rangeLow = this.#numPoints * -0.3;
    rangeHigh = this.#numPoints * 0.7;

    constructor() {
        super();
    }

    // relative to earth's body center
    positionAtTime(jd) {
        var jd19, t, t2;
        var ld, ms, md, de, f, n, hp;
        var a, sa, sn, b, sb, c, sc, e, e2, l, g, w1, w2;
        var m1, m2, m3, m4, m5, m6;
        var eclLon, eclLat, horzPar, distance;

        const degToRad = d => d * Math.PI / 180;

        // Computation requires an abbreviated Julian day:
        // epoch January 0.5, 1900.
        jd19 = jd - 2415020.0;
        t = jd19 / 36525;
        t2 = t * t;

        m1 = jd19 / 27.32158213;
        m1 = 360.0 * (m1 - Math.floor(m1));
        m2 = jd19 / 365.2596407;
        m2 = 360.0 * (m2 - Math.floor(m2));
        m3 = jd19 / 27.55455094;
        m3 = 360.0 * (m3 - Math.floor(m3));
        m4 = jd19 / 29.53058868;
        m4 = 360.0 * (m4 - Math.floor(m4));
        m5 = jd19 / 27.21222039;
        m5 = 360.0 * (m5 - Math.floor(m5));
        m6 = jd19 / 6798.363307;
        m6 = 360.0 * (m6 - Math.floor(m6));

        ld = 270.434164 + m1 - (.001133 - .0000019 * t) * t2;
        ms = 358.475833 + m2 - (.00015 + .0000033 * t) * t2;
        md = 296.104608 + m3 + (.009192 + .0000144 * t) * t2;
        de = 350.737486 + m4 - (.001436 - .0000019 * t) * t2;
        f = 11.250889 + m5 - (.003211 + .0000003 * t) * t2;
        n = 259.183275 - m6 + (.002078 + .000022 * t) * t2;

        a = degToRad(51.2 + 20.2 * t);
        sa = Math.sin(a);
        sn = Math.sin(degToRad(n));
        b = 346.56 + (132.87 - .0091731 * t) * t;
        sb = .003964 * Math.sin(degToRad(b));
        c = degToRad(n + 275.05 - 2.3 * t);
        sc = Math.sin(c);
        ld = ld + .000233 * sa + sb + .001964 * sn;
        ms = ms - .001778 * sa;
        md = md + .000817 * sa + sb + .002541 * sn;
        f = f + sb - .024691 * sn - .004328 * sc;
        de = de + .002011 * sa + sb + .001964 * sn;
        e = 1 - (.002495 + 7.52e-06 * t) * t;
        e2 = e * e;

        ld = degToRad(ld);
        ms = degToRad(ms);
        n = degToRad(n);
        de = degToRad(de);
        f = degToRad(f);
        md = degToRad(md);

        l = 6.28875 * Math.sin(md) + 1.27402 * Math.sin(2 * de - md) + .658309 * Math.sin(2 * de) +
            .213616 * Math.sin(2 * md) - e * .185596 * Math.sin(ms) - .114336 * Math.sin(2 * f) +
            .058793 * Math.sin(2 * (de - md)) + .057212 * e * Math.sin(2 * de - ms - md) +
            .05332 * Math.sin(2 * de + md) + .045874 * e * Math.sin(2 * de - ms) + .041024 * e * Math.sin(md - ms);
        l = l - .034718 * Math.sin(de) - e * .030465 * Math.sin(ms + md) + .015326 * Math.sin(2 * (de - f)) -
            .012528 * Math.sin(2 * f + md) - .01098 * Math.sin(2 * f - md) + .010674 * Math.sin(4 * de - md) +
            .010034 * Math.sin(3 * md) + .008548 * Math.sin(4 * de - 2 * md) - e * .00791 * Math.sin(ms - md + 2 * de) -
            e * .006783 * Math.sin(2 * de + ms);
        l = l + .005162 * Math.sin(md - de) + e * .005 * Math.sin(ms + de) + .003862 * Math.sin(4 * de) +
            e * .004049 * Math.sin(md - ms + 2 * de) + .003996 * Math.sin(2 * (md + de)) +
            .003665 * Math.sin(2 * de - 3 * md) + e * .002695 * Math.sin(2 * md - ms) +
            .002602 * Math.sin(md - 2 * (f + de)) + e * .002396 * Math.sin(2 * (de - md) - ms) -
            .002349 * Math.sin(md + de);
        l = l + e2 * .002249 * Math.sin(2 * (de - ms)) - e * .002125 * Math.sin(2 * md + ms) -
            e2 * .002079 * Math.sin(2 * ms) + e2 * .002059 * Math.sin(2 * (de - ms) - md) -
            .001773 * Math.sin(md + 2 * (de - f)) - .001595 * Math.sin(2 * (f + de)) +
            e * .00122 * Math.sin(4 * de - ms - md) - .00111 * Math.sin(2 * (md + f)) + .000892 * Math.sin(md - 3 * de);
        l = l - e * .000811 * Math.sin(ms + md + 2 * de) + e * .000761 * Math.sin(4 * de - ms - 2 * md) +
            e2 * .000704 * Math.sin(md - 2 * (ms + de)) + e * .000693 * Math.sin(ms - 2 * (md - de)) +
            e * .000598 * Math.sin(2 * (de - f) - ms) + .00055 * Math.sin(md + 4 * de) + .000538 * Math.sin(4 * md) +
            e * .000521 * Math.sin(4 * de - ms) + .000486 * Math.sin(2 * md - de);
        l = l + e2 * .000717 * Math.sin(md - 2 * ms);
        eclLon = ld + degToRad(l);
        eclLon = eclLon - 2 * Math.PI * Math.floor(eclLon / (2 * Math.PI));

        g = 5.12819 * Math.sin(f) + .280606 * Math.sin(md + f) + .277693 * Math.sin(md - f) +
            .173238 * Math.sin(2 * de - f) + .055413 * Math.sin(2 * de + f - md) + .046272 * Math.sin(2 * de - f - md) +
            .032573 * Math.sin(2 * de + f) + .017198 * Math.sin(2 * md + f) + .009267 * Math.sin(2 * de + md - f) +
            .008823 * Math.sin(2 * md - f) + e * .008247 * Math.sin(2 * de - ms - f);
        g = g + .004323 * Math.sin(2 * (de - md) - f) + .0042 * Math.sin(2 * de + f + md) +
            e * .003372 * Math.sin(f - ms - 2 * de) + e * .002472 * Math.sin(2 * de + f - ms - md) +
            e * .002222 * Math.sin(2 * de + f - ms) + e * .002072 * Math.sin(2 * de - f - ms - md) +
            e * .001877 * Math.sin(f - ms + md) + .001828 * Math.sin(4 * de - f - md) - e * .001803 * Math.sin(f + ms) -
            .00175 * Math.sin(3 * f);
        g = g + e * .00157 * Math.sin(md - ms - f) - .001487 * Math.sin(f + de) - e * .001481 * Math.sin(f + ms + md) +
            e * .001417 * Math.sin(f - ms - md) + e * .00135 * Math.sin(f - ms) + .00133 * Math.sin(f - de) +
            .001106 * Math.sin(f + 3 * md) + .00102 * Math.sin(4 * de - f) + .000833 * Math.sin(f + 4 * de - md) +
            .000781 * Math.sin(md - 3 * f) + .00067 * Math.sin(f + 4 * de - 2 * md);
        g = g + .000606 * Math.sin(2 * de - 3 * f) + .000597 * Math.sin(2 * (de + md) - f) +
            e * .000492 * Math.sin(2 * de + md - ms - f) + .00045 * Math.sin(2 * (md - de) - f) +
            .000439 * Math.sin(3 * md - f) + .000423 * Math.sin(f + 2 * (de + md)) +
            .000422 * Math.sin(2 * de - f - 3 * md) - e * .000367 * Math.sin(ms + f + 2 * de - md) -
            e * .000353 * Math.sin(ms + f + 2 * de) + .000331 * Math.sin(f + 4 * de);
        g = g + e * .000317 * Math.sin(2 * de + f - ms + md) + e2 * .000306 * Math.sin(2 * (de - ms) - f) -
            .000283 * Math.sin(md + 3 * f);
        w1 = .0004664 * Math.cos(n);
        w2 = .0000754 * Math.cos(c);
        eclLat = degToRad(g) * (1 - w1 - w2);

        hp = .950724 + .051818 * Math.cos(md) + .009531 * Math.cos(2 * de - md) + .007843 * Math.cos(2 * de) +
            .002824 * Math.cos(2 * md) + .000857 * Math.cos(2 * de + md) + e * .000533 * Math.cos(2 * de - ms) +
            e * .000401 * Math.cos(2 * de - md - ms) + e * .00032 * Math.cos(md - ms) - .000271 * Math.cos(de) -
            e * .000264 * Math.cos(ms + md) - .000198 * Math.cos(2 * f - md);
        hp = hp + .000173 * Math.cos(3 * md) + .000167 * Math.cos(4 * de - md) - e * .000111 * Math.cos(ms) +
            .000103 * Math.cos(4 * de - 2 * md) - .000084 * Math.cos(2 * md - 2 * de) -
            e * .000083 * Math.cos(2 * de + ms) + .000079 * Math.cos(2 * de + 2 * md) + .000072 * Math.cos(4 * de) +
            e * .000064 * Math.cos(2 * de - ms + md) - e * .000063 * Math.cos(2 * de + ms - md) +
            e * .000041 * Math.cos(ms + de);
        hp = hp + e * .000035 * Math.cos(2 * md - ms) - .000033 * Math.cos(3 * md - 2 * de) -
            .00003 * Math.cos(md + de) - .000029 * Math.cos(2 * (f - de)) - e * .000029 * Math.cos(2 * md + ms) +
            e2 * .000026 * Math.cos(2 * (de - ms)) - .000023 * Math.cos(2 * (f - de) + md) +
            e * .000019 * Math.cos(4 * de - ms - md);
        horzPar = degToRad(hp);

        distance = 6378.14 / Math.sin(horzPar) / KM_PER_AU;

        return new Vector3(
            distance * Math.cos(eclLat) * Math.cos(eclLon),
            distance * Math.cos(eclLat) * Math.sin(eclLon),
            distance * Math.sin(eclLat)
        );
    }

    orbitAtTime(jd) {
        const orbitPoints = [];
        for (let i = this.rangeLow; i < this.rangeHigh; i++) {
            const jd1 = jd + i * this.#dt;
            orbitPoints.push(this.positionAtTime(jd1));
        }
        this.#prevHead = jd + this.rangeLow * this.#dt;
        this.#prevTail = jd + this.rangeHigh * this.#dt;
        this.#lastTime = jd;
        return orbitPoints;
    }

    orbitCurve(jd) {
        if (this.#orbitPoints.length === 0) {
            this.#orbitPoints = this.orbitAtTime(jd);
        } else if (Math.abs(jd - this.#lastTime) > this.#total / 3) {
            this.#orbitPoints = this.orbitAtTime(jd);
            console.log("change moon orbit");
        } else {
            if (jd > this.#lastTime) {
                const now_head = jd + this.rangeLow * this.#dt;
                // const now_tail = jd + this.range_high * this.#dt;
                while (this.#prevHead < now_head) {
                    this.#orbitPoints.shift();
                    this.#prevHead += this.#dt;
                }
                while (this.#orbitPoints.length < this.rangeHigh - this.rangeLow) {
                    this.#orbitPoints.push(this.positionAtTime(this.#prevTail));
                    this.#prevTail += this.#dt;
                }

            } else if (jd < this.#lastTime) {
                const now_tail = jd + this.rangeHigh * this.#dt;
                while (this.#prevTail > now_tail) {
                    this.#orbitPoints.pop();
                    this.#prevTail -= this.#dt;
                }
                while (this.#orbitPoints.length < this.rangeHigh - this.rangeLow) {
                    this.#orbitPoints.unshift(this.positionAtTime(this.#prevHead - this.#dt));
                    this.#prevHead -= this.#dt;
                }
            }
        }
        this.#lastTime = jd;
        const PointsCopy = this.#orbitPoints.slice();
        return PointsCopy;
    }

}

export { SunOrbit, EarthOrbit, MoonOrbit };
