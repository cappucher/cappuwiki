const showdown = require('showdown');
const converter = new showdown.Converter();
const parse = require('querystring');
const fs = require('fs');
const http = require('http');
const url = require('url');

const findPageIndex = (pages, target) => {
    for (let i = 0; i < pages.length; i++){
        if (pages[i].title.toLowerCase() == target.toLowerCase()){
            return i;
        }
    }
    return -1;
}

const findSubstrings = (pages, target) => {
    const targets = [];
    for (let i = 0; i < pages.length; i++){
        let temp = pages[i].title.toLowerCase();
        if (pages[i].title.toLowerCase().replace(/_/g, " ").includes(target.toLowerCase())){
            targets.push(i);
        }
        else if (pages[i].title.toLowerCase().replace(/_/g, " ").includes(target.replace(/%20/g, " ").toLowerCase())){
            targets.push(i);
        }
    }
    return targets;
}

const retrieveData = () => {
    http.createServer((req, res) => {
        const q = url.parse(req.url, true);
        const pages = JSON.parse(fs.readFileSync('pages.json', 'utf8'));
        if (req.method == "POST" && q.pathname.slice(1).toLowerCase() == "index"){
            let body = '';
            req.on('data', chunk => {
                body += chunk.toString(); // convert Buffer to string
            });
            req.on('end', () => {
                const temp = parse.parse(body);
                temp.title = temp.title.replace(/ /g, '_');
                if (findPageIndex(pages, temp.title) != -1){
                    res.writeHead(200, {'Content-Type': 'text/html'});
                    res.write("that page already exists.");
                    return res.end(fs.readFileSync('./index.html', 'utf8'));
                }
                if (temp.body.length > 7500){
                    res.writeHead(200, {'Content-Type': 'text/html'});
                    res.write("that page is too long.");
                    return res.end(fs.readFileSync('./index.html', 'utf8'));
                }
                pages.push(temp);
                fs.writeFileSync('pages.json', JSON.stringify(pages));
                return res.end(fs.readFileSync('./index.html', 'utf8'));
            });
        }
        else if (req.method == "POST" && q.pathname.slice(1).toLowerCase() == "search"){
            let body = '';
            req.on('data', chunk => {
                body += chunk.toString();
            });
            req.on('end', () => {
                const temp = parse.parse(body);
                const other = temp.article.replace(/ /g, "_")
                if (findPageIndex(pages, other) != -1){
                    res.writeHead(301, {'Location': `wiki/${other}`});
                    return res.end();
                }
                const substrings = findSubstrings(pages, temp.article);
                res.writeHead(200, {'Content-Type': 'text/html'});
                res.write("<h1>Searcher</h1>")
                res.write(`
                    <form action="/search" method="post" id="search">
                        <input type="text" placeholder="search..." name="article">
                        <input type="submit" value="submit">
                    </form>
                `)
                for (let i = 0; i < substrings.length; i++){
                    res.write(`<a href=wiki/${pages[substrings[i]].title}>${pages[substrings[i]].title.replace(/_/g, " ")}</a><br>`)
                }
                res.write(`<a href="../index">Go back to new page creator</a><br>`);
                res.write(`<a href="/wiki/${pages[Math.floor(Math.random() * pages.length)].title.replace(/ /g, "_")}">Go to a random page</a><br>`);
                res.write(`<style>${fs.readFileSync('style.css', 'utf8')}</style>`);
                res.write(`<script>${fs.readFileSync('script.js', 'utf8')}</script>`);
                return res.end();
            });
        }
        else if (req.method == "POST" && q.pathname.slice(1, 5) == "edit"){
            let body = '';
            req.on('data', chunk => {
                body += chunk.toString();
            });
            req.on('end', () => {
                const temp = parse.parse(body);
                pages[findPageIndex(pages, q.pathname.slice(6))].body = temp.body;
                fs.writeFileSync('pages.json', JSON.stringify(pages));
                res.writeHead(301, {'Location': `/wiki/${q.pathname.slice(6)}`});
                return res.end();
            });
        }
        if (q.pathname.slice(1).toLowerCase() == "index"){
            fs.readFile('./index.html', (err, data) => {
                res.writeHead(200, {'Content-Type': 'text/html'});
                res.write(data);
                res.write(`<br><a href="/wiki/${pages[Math.floor(Math.random() * pages.length)].title.replace(/ /g, "_")}">Go to a random page</a><br>`);
                res.write(`<style>${fs.readFileSync('style.css', 'utf8')}</style>`);
                res.write(`<script>${fs.readFileSync('script.js', 'utf8')}</script>`)
                return res.end();
            });
        }
        else if (q.pathname.slice(1).toLowerCase() == "search"){
            fs.readFile('./search.html', (err, data) => {
                res.writeHead(200, {'Content-Type': 'text/html'});
                res.write(data);
                res.write(`<br><a href="/wiki/${pages[Math.floor(Math.random() * pages.length)].title.replace(/ /g, "_")}">Go to a random page</a><br>`);
                res.write(`<style>${fs.readFileSync('style.css', 'utf8')}</style>`);
                res.write(`<script>${fs.readFileSync('script.js', 'utf8')}</script>`)
                return res.end();
            });
        }
        else if (q.pathname.slice(1, 5) == "edit"){
            res.writeHead(200, {'Content-Type': 'text/html'});
            res.write(`
                <form action="/search" method="post" id="search">
                    <input type="text" placeholder="search..." name="article">
                    <input type="submit" value="submit">
                </form>
            `)
            const sliced = q.pathname.slice(6);
            const replaced = sliced.replace(/_/g, " ");
            res.write(`<h1>${replaced}</h1>`);
            res.write(`
                <form action="/edit/${sliced}" method="post" id="search">
                    <textarea type="text" name="body">${pages[findPageIndex(pages, sliced)].body}</textarea><br>
                    <input type="submit" value="submit">
                </form>
            `)
            res.write(`<a href="/wiki/${sliced}">Go back to the ${replaced} page</a><br>`);
            res.write(`<a href="../index">Go back to new page creator</a>`);
            res.write(`<br><a href="/wiki/${pages[Math.floor(Math.random() * pages.length)].title.replace(/ /g, "_")}">Go to a random page</a><br>`);
            res.write(`<style>${fs.readFileSync('style.css', 'utf8')}</style>`);
            res.write(`<script>${fs.readFileSync('script.js', 'utf8')}</script>`)
            return res.end();            
        }
        else{
            const index = findPageIndex(pages, q.pathname.slice(6))
            if (index != -1){
                res.writeHead(200, {'Content-Type': 'text/html'});
                pages[index].title = pages[index].title.replace(/_/g, " ");
                res.write(`
                    <form action="/search" method="post" id="search">
                        <input type="text" placeholder="search..." name="article">
                        <input type="submit" value="submit">
                    </form>
                `)
                res.write(`<h1>${pages[index].title}</h1>`)
                res.write(converter.makeHtml(pages[index].body));
                res.write(`<a href="../edit/${pages[index].title.replace(/ /g, "_")}">Edit this page</a><br>`)
                res.write(`<a href="../index">Go back to new page creator</a><br>`);
                res.write(`<a href="/wiki/${pages[Math.floor(Math.random() * pages.length)].title.replace(/ /g, "_")}">Go to a random page</a><br>`);
                res.write(`<style>${fs.readFileSync('style.css', 'utf8')}</style>`);
                res.write(`<script>${fs.readFileSync('script.js', 'utf8')}</script>`)
                return res.end();
            }
            res.writeHead(404, {'Content-Type': 'text/html'});
            res.write("<div>404, not found</div>");
            res.write(`<a href="../index">Go back to new page creator</a>`);
            return res.end();
        }
        
    }).listen(8080); 
}

retrieveData();