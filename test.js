var downsize = require("./"),
    chai = require("chai"),
    mocha = require("mocha");
chai.should();

describe("Word-wise truncation", function () {

    it("should be able to truncate across nested tags", function () {
        downsize("<p>this is a <strong>test of word downsizing</strong></p>", {words: 5})
            .should.equal("<p>this is a <strong>test of</strong></p>");
    });

    it("should be able to truncate even if a single quote is found inside a string of double quotes or vice-versa", function () {
        downsize('<p><img src="/someUrl.jpg" alt="Let\'s get in!"></p><p>hello world</p>', { words: 1 })
            .should.equal('<p><img src="/someUrl.jpg" alt="Let\'s get in!"></p><p>hello</p>');
    });

    it("should be able to naively balance HTML markup", function () {
        downsize("<p><p><p><p>this is a <strong>test of word downsizing</strong> some stuff</p>", {words: 5})
            .should.equal("<p><p><p><p>this is a <strong>test of</strong></p></p></p></p>");
    });

    it("should be able to naively balance HTML markup", function () {
        downsize("<p><p><p><p>this is a <strong>test of word downsizing</strong> some stuff</p>", {words: 5})
            .should.equal("<p><p><p><p>this is a <strong>test of</strong></p></p></p></p>");
    });

    it("should ignore erroneously unescaped carets", function () {
        downsize("<p>this < is a <strong>test of word downsizing</strong> some stuff</p>", {words: 5})
            .should.equal("<p>this < is a <strong>test of</strong></p>");

        downsize("<p>this < is a > test < test > <strong>test of word downsizing</strong> some stuff</p>", {words: 5})
            .should.equal("<p>this < is a > test < test</p>");
    });

    it("should ignore comments in markup, and carets in comments", function () {
        downsize("<p>this <!-- is a > test < test --> <strong>test of word downsizing</strong> some stuff</p>", {words: 2})
            .should.equal("<p>this <!-- is a > test < test --> <strong>test</strong></p>");
    });

    it("should understand implicitly void tags, and not attempt to close them", function () {
        downsize("<p>test <img src=\"blah.jpg\"> <strong>stuffo</strong> some stuff</p>", {words: 2})
            .should.equal("<p>test <img src=\"blah.jpg\"> <strong>stuffo</strong></p>");
    });

    it("should understand self-closing tags, and not attempt to close them", function () {
        downsize("<p>test <random selfclosing /> <strong>stuffo</strong> some stuff</p>", {words: 2})
            .should.equal("<p>test <random selfclosing /> <strong>stuffo</strong></p>");
    });

    it("should understand self-closing tags, even marked up poorly.", function () {
        downsize("<p>test <random selfclosing / > <strong>stuffo</strong> some stuff</p>", {words: 2})
            .should.equal("<p>test <random selfclosing / > <strong>stuffo</strong></p>");
    });

    it("should close unknown tags appropriately", function () {
        downsize("<p>test <unknown> <strong>stuffo</strong> some stuff</p>", {words: 2})
            .should.equal("<p>test <unknown> <strong>stuffo</strong></unknown></p>");
    });

    it("should permit unescaped carets inside double-quoted strings", function () {
        downsize("<p>test string <img \"<stuffo>\"> <strong>stuffo</strong> some stuff</p>", {words: 3})
            .should.equal("<p>test string <img \"<stuffo>\"> <strong>stuffo</strong></p>");
    });

    it("should permit unescaped carets inside single-quoted strings", function () {
        downsize("<p>test string <img '<stuffo>'> <strong>stuffo</strong> some stuff</p>", {words: 3})
            .should.equal("<p>test string <img '<stuffo>'> <strong>stuffo</strong></p>");
    });

    it("should properly recognised manually closed elements, and do not re-close elements", function () {
        downsize("<p>tag closing test</p><p>There should only</p><p>be one terminating para</p>", {words: 7})
            .should.equal("<p>tag closing test</p><p>There should only</p><p>be</p>");
    });

    it("should properly handle unicode languages", function () {
        downsize("Рэпудёандаэ конжыквуюнтюр эю прё, нэ квуй янжольэнж квюальизквюэ чадипжкёнг. Ед кюм жкрипта", {words: 3})
            .should.equal("Рэпудёандаэ конжыквуюнтюр эю");
    });

    it("should properly handle unicode languages across nested tags", function () {
        downsize("<p>Рэпудёандаэ конжыквуюнтюр эю прё, <span>нэ квуй янжольэнж квюальизквюэ</span> чадипжкёнг. Ед кюм жкрипта</p>", {words: 3})
            .should.equal("<p>Рэпудёандаэ конжыквуюнтюр эю</p>");
    });

    it("should properly properly character-truncate across tag boundries", function () {
        downsize("<p>abcdefghij</p><p>klmnop</p><p>qrs</p>", {characters: 15})
            .should.equal("<p>abcdefghij</p><p>klmno</p>");
    });

    it("should not have trailing empty tags", function () {
        downsize("<p>there are five words here</p><i>what</i>", {words: 5})
            .should.equal("<p>there are five words here</p>");
    });

    it("should await the end of the containing paragraph", function () {
        downsize("<p>there are more than seven words in this paragraph</p><p>this is unrelated</p>", {words: 7, contextualTags: ["p", "ul", "ol", "pre", "blockquote"]})
            .should.equal("<p>there are more than seven words in this paragraph</p>");
    });

    it("should await the end of the containing unordered list", function () {
        downsize("<ul><li>item one</li><li>item two</li><li>item three</li></ul><p>paragraph</p>", {words: 5, contextualTags: ["p", "ul", "ol", "pre", "blockquote"]})
            .should.equal("<ul><li>item one</li><li>item two</li><li>item three</li></ul>");
    });

    it("should await the end of the containing paragraph", function () {
        downsize("<p>there are many more than seven characters in this paragraph</p><p>this is unrelated</p>", {characters: 7, contextualTags: ["p", "ul", "ol", "pre", "blockquote"]})
            .should.equal("<p>there are many more than seven characters in this paragraph</p>");
    });

});

describe("Appending", function () {
    it("should properly append an ellipsis where required", function () {
        downsize("<p>abcdefghij</p><p>klmnop</p><p>qrs</p>", {characters: 15, append: "..."})
            .should.equal("<p>abcdefghij</p><p>klmno...</p>");

        downsize("<p>here's some text.</p>", {words: 2, append: "... (read more)"})
            .should.equal("<p>here's some... (read more)</p>");
    });

    it("should not append an ellipsis where not required", function () {
        downsize("<p>here's some text.</p>", {words: 5, append: "..."})
            .should.equal("<p>here's some text.</p>");
    });
});

describe("Performance", function () {
    var perfTestSeed = "";
    for (var i = 0; i < 1000000; i++) {
        perfTestSeed += "<p>word truncate performance test</p>\n";
    }

    describe("truncate five words from a four-million word corpus one hundred thousand times", function () {
        it("benchmark time should be under twenty seconds", function () {
            var startTime = Date.now();
            for (i = 0; i < 100000; i++) {
                downsize(perfTestSeed, {"words": 5});
            }
            (Date.now() - startTime).should.be.lte(20*1000);
        });
    });
});
