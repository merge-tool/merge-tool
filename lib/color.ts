export function lightOrDark(color : string) : 'light'|'dark' {
    let r, g, b, hsp, c
    if (color.length < 5 ) {
        c = +("0x" + color.slice(1).replace(/./g, '$&$&'))
    } else {
        c = +("0x" + color.slice(1))
    }

    r = c >> 16;
    g = c >> 8 & 255;
    b = c & 255;

    // HSP equation from http://alienryderflex.com/hsp.html
    hsp = Math.sqrt(
        0.299 * (r * r) +
            0.587 * (g * g) +
            0.114 * (b * b)
    );

    // Using the HSP value, determine whether the color is light or dark
    return hsp > 127.5 ? 'light' : 'dark'
}
