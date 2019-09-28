import moment from 'moment';
import momentDurationFormatSetup from 'moment-duration-format';
import assToVtt from './assToVtt';

momentDurationFormatSetup(moment);

export function checkTime(time) {
    return /^(\d+):([0-5][0-9]):([0-5][0-9])\.\d{3}$/.test(time);
}

export function isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(window.navigator.userAgent);
}

export function getExt(url) {
    if (url.includes('?')) {
        return getExt(url.split('?')[0]);
    }

    if (url.includes('#')) {
        return getExt(url.split('#')[0]);
    }

    return url
        .trim()
        .toLowerCase()
        .split('.')
        .pop();
}

export function sleep(ms = 0) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export function checkDuration(duration) {
    return /^\d+\.\d{3}/.test(duration);
}

export function clamp(num, a, b) {
    return Math.max(Math.min(num, Math.max(a, b)), Math.min(a, b));
}

export function secondToTime(seconds) {
    const duration = moment.duration(seconds, 'seconds');
    return duration.format('hh:mm:ss.SSS', {
        trim: false,
    });
}

export function timeToSecond(time) {
    return moment.duration(time).asSeconds();
}

export function debounce(func, wait, context) {
    let timeout;
    return function fn(...args) {
        const later = function later() {
            timeout = null;
            func.apply(context, args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

export function urlToArr(url) {
    return new Promise(resolve => {
        const $video = document.createElement('video');
        const $track = document.createElement('track');
        $track.default = true;
        $track.kind = 'metadata';
        $video.appendChild($track);
        $track.onload = () => {
            const arr = Array.from($track.track.cues).map((item, index) => {
                return {
                    editing: false,
                    highlight: false,
                    index: index,
                    start: secondToTime(item.startTime),
                    end: secondToTime(item.endTime),
                    text: item.text,
                    get startTime() {
                        return timeToSecond(this.start);
                    },
                    get endTime() {
                        return timeToSecond(this.end);
                    },
                    get duration() {
                        return (this.endTime - this.startTime).toFixed(3);
                    },
                    get overlapping() {
                        return arr[index - 1] && this.startTime < arr[index - 1].endTime;
                    },
                };
            });
            resolve(arr);
        };
        $track.src = url;
    });
}

export function vttToUrl(vttText) {
    return URL.createObjectURL(
        new Blob([vttText], {
            type: 'text/vtt',
        }),
    );
}

export function arrToVtt(arr) {
    return (
        'WEBVTT\n\n' +
        arr
            .map((item, index) => {
                return (
                    index + 1 + '\n' + secondToTime(item.start) + ' --> ' + secondToTime(item.end) + '\n' + item.text
                );
            })
            .join('\n\n')
    );
}

export function srtToVtt(srtText) {
    return 'WEBVTT \r\n\r\n'.concat(
        srtText
            .replace(/\{\\([ibu])\}/g, '</$1>')
            .replace(/\{\\([ibu])1\}/g, '<$1>')
            .replace(/\{([ibu])\}/g, '<$1>')
            .replace(/\{\/([ibu])\}/g, '</$1>')
            .replace(/(\d\d:\d\d:\d\d),(\d\d\d)/g, '$1.$2')
            .replace(/{[\s\S]*?}/g, '')
            .concat('\r\n\r\n'),
    );
}

export function readSubtitleFromFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        const type = file.name
            .split('.')
            .pop()
            .toLowerCase();
        reader.onload = () => {
            if (type === 'srt') {
                resolve(srtToVtt(reader.result));
            } else if (type === 'ass') {
                resolve(assToVtt(reader.result));
            } else {
                resolve(reader.result.replace(/{[\s\S]*?}/g, ''));
            }
        };
        reader.onerror = error => {
            reject(error);
        };
        reader.readAsText(file);
    });
}

export function readSubtitleFromUrl(url) {
    let type;
    return fetch(url)
        .then(response => {
            type = response.headers.get('Content-Type');
            return response.text();
        })
        .then(text => {
            if (/x-subrip/gi.test(type)) {
                return srtToVtt(text);
            }
            return text;
        })
        .catch(error => {
            throw error;
        });
}

export function downloadFile(url, name) {
    const elink = document.createElement('a');
    elink.style.display = 'none';
    elink.href = url;
    elink.download = name;
    document.body.appendChild(elink);
    elink.click();
    document.body.removeChild(elink);
}

export function runPromisesInSeries(ps) {
    return ps.reduce((p, next) => p.then(next), Promise.resolve());
}

export function escapeHTML(str) {
    return str.replace(
        /[&<>'"]/g,
        tag =>
            ({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                "'": '&#39;',
                '"': '&quot;',
            }[tag] || tag),
    );
}

export function unescapeHTML(str) {
    return str.replace(
        /&amp;|&lt;|&gt;|&#39;|&quot;/g,
        tag =>
            ({
                '&amp;': '&',
                '&lt;': '<',
                '&gt;': '>',
                '&#39;': "'",
                '&quot;': '"',
            }[tag] || tag),
    );
}
