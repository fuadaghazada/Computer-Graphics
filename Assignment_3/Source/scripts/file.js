/**
    Reference:

    https://stackoverflow.com/questions/3665115/create-a-file-in-memory-for-user-to-download-not-through-server
*/
function download(filename, text)
{
    var element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', filename);

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
}
