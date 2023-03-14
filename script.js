if (window.location.href.slice(22, 26) == "wiki"){
    const word = window.location.href.slice(27).replace(/_/g, " ");
    document.title = word.charAt(0).toUpperCase() + word.slice(1)
}
else if (window.location.href.slice(22, 26) == "edit"){
    const word = window.location.href.slice(27).replace(/_/g, " ");
    document.title = "Edit \"" + word.charAt(0).toUpperCase() + word.slice(1) + "\""
}

