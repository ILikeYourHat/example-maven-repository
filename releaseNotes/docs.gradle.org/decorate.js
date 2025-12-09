$(document).ready(function () {
    var parts = location.pathname.replace("/", "").split("/", 3);
    var version = parts[0];
    var docset = parts[1].replace(/\..*$/, "");
    var path = parts[2];

    var $body = $("body");
    var isIn = function (thing, things) {
        for (var i = 0; i < things.length; i++) {
            if (thing === things[i]) {
                return true;
            }
        }
        return false;
    };

    $body.addClass(docset);
    if (isIn(docset, ["release-notes", "userguide", "dsl"])) {
        var fixedContainer = $("<div id='fixed-container'/>").appendTo($body);

        if (docset === "release-notes") {
            $("div.text-container:first").detach().appendTo(fixedContainer);
        } else if (docset === "userguide") {
            $("div.sidebar").detach().appendTo(fixedContainer);
            $("div.book:first,div.chapter:first,div.part:first,div.appendix:first,div.glossary:first").appendTo(fixedContainer);
            $(".site-footer").detach().appendTo($body);
        } else if (docset === "dsl") {
            $("div.sidebar").detach().appendTo(fixedContainer);
            var contentContainer = $("<div id='content-container'/>").appendTo(fixedContainer);
            $("div.book:first,div.chapter:first,div.part:first,div.appendix:first,div.glossary:first").appendTo(contentContainer);
            $(".site-footer").detach().appendTo($body);
        }
    }

    // 1.5 had bugs in this area
    var oldMarkers = $("section > .incubating-marker");
    if (oldMarkers.length > 0) {
        $("section > .incubating-marker").each(function () {
            var element = $(this);
            var heading = element.prev(".incubating");
            element.remove();
            heading.append(element);
        });
    }

    function versionizeLogo(version) {
        document.querySelector(".site-header-version").textContent = version;
    }

    // Insert navbar if it doesn't exist yet
    if ($(".site-header").length === 0) {
        $.ajax({
            url: '/site-header.html',
            success: function (data) {
                $(data).prependTo($body);
                postProcessNavigation();
                versionizeLogo(window.siteDecorateVersion);
            }
        });
    } else {
        postProcessNavigation();
    }

    // Inject meta widget for individual docs chapters
    if (docset === "userguide") {
        if (typeof path === "string" && !/^(userguide|pt)/.test(path) && $(".chapter-meta").length === 0) {
            $.get("/userguide-meta.html", function (content) {
                $(content).insertBefore($(".titlepage h1"));
                handleChapterMeta();
            });
        } else {
            handleChapterMeta();
        }
    }

    // Insert footer if it doesn't exist yet but not on Javadoc 8.12 and newer
    if (!(docset === "javadoc" && (parseFloat(version) > 8.11 || version == "current" || version == "nightly" || version == "release-nightly"))) {
        if ($(".site-footer").length === 0) {
            $.get('/site-footer.html', function (data) {
                $body.append(data);
                postProcessFooter();
            });
        } else {
            postProcessFooter();
        }
    }
});
