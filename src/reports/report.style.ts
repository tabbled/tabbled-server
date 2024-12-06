export const style = `
> * + * {
        margin-top: 0.2em;
    }

body {
    line-height: 24px;    
}

body p {
    padding-top: 0;
    padding-bottom: 0;
    margin-block-start: 0;
    margin-block-end: 0;
}



body ul,
ol {
    padding: 0 1rem;
}

    h1,
    h2,
    h3,
    h4,
    h5,
    h6 {
        line-height: 1.1;
    }
    
    h1 { font-size: 2.00rem; }
    h2 { font-size: 1.74rem; }
    h3 { font-size: 1.52rem; }
    h4 { font-size: 1.32rem; }
    h5 { font-size: 1.15rem; }
    h6 { font-size: 1.00rem; }

body pre {
    background: #0D0D0D;
    color: #FFF;
    font-family: 'JetBrainsMono', monospace;
    padding: 0.75rem 1rem;
    border-radius: 0.5rem;
}

body code {
    color: inherit;
    padding: 0;
    background: none;
    font-size: 0.8rem;
}

body img {
    max-width: 100%;
    height: auto;
}

body blockquote {
    padding-left: 1rem;
    border-left: 2px solid gray;
}

body hr {
    border: none;
    border-top: 2px solid gray;
    margin: 2rem 0;
}
    
body mark {
    background-color: #ffe066;
    padding: 0.125em 0;
    border-radius: 0.25em;
    box-decoration-break: clone;
}

body table {
    border-collapse: collapse;
    margin: 0;
    overflow: hidden;
    table-layout: fixed;
    //border: 1px solid rgb(203 213 225);
}

body table td, th {
        border: 1px solid rgb(203 213 225);
        box-sizing: border-box;
        min-width: 1em;
        padding: 6px 8px;
        position: relative;
        vertical-align: top;

        > * {
            margin-bottom: 0;
        }
    }

body table th {
    background-color: rgb(248 250 252);
    font-weight: bold;
    text-align: left;
    white-space: normal;
}

body table td {
    border: 1px solid rgb(203 213 225);
    text-align: left;
    white-space: normal;
}
`