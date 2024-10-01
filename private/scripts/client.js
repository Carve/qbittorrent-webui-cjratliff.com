/*
 * MIT License
 * Copyright (c) 2008 Ishan Arora <ishan@qbittorrent.org>,
 * Christophe Dumez <chris@qbittorrent.org>
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

'use strict';

window.qBittorrent ??= {};
window.qBittorrent.Client ??= (() => {
    const exports = () => {
        return {
            closeWindow: closeWindow,
            closeWindows: closeWindows,
            getSyncMainDataInterval: getSyncMainDataInterval,
            isStopped: isStopped,
            stop: stop,
            mainTitle: mainTitle,
            showSearchEngine: showSearchEngine,
            showRssReader: showRssReader,
            showLogViewer: showLogViewer,
            isShowSearchEngine: isShowSearchEngine,
            isShowRssReader: isShowRssReader,
            isShowLogViewer: isShowLogViewer
        };
    };

    const closeWindow = function(windowID) {
        const window = document.getElementById(windowID);
        if (!window)
            return;
        MochaUI.closeWindow(window);
    };

    const closeWindows = function() {
        MochaUI.closeAll();
    };

    const getSyncMainDataInterval = function() {
        return customSyncMainDataInterval ? customSyncMainDataInterval : serverSyncMainDataInterval;
    };

    let stopped = false;
    const isStopped = () => {
        return stopped;
    };

    const stop = () => {
        stopped = true;
    };

    const mainTitle = () => {
        const emDash = "\u2014";
        const qbtVersion = window.qBittorrent.Cache.qbtVersion.get();
        const suffix = window.qBittorrent.Cache.preferences.get()["app_instance_name"] || "";
        const title = `qBittorrent ${qbtVersion} WebUI`
            + ((suffix.length > 0) ? ` ${emDash} ${suffix}` : "");
        return title;
    };

    let showingSearchEngine = false;
    let showingRssReader = false;
    let showingLogViewer = false;

    const showSearchEngine = function(bool) {
        showingSearchEngine = bool;
    };
    const showRssReader = function(bool) {
        showingRssReader = bool;
    };
    const showLogViewer = function(bool) {
        showingLogViewer = bool;
    };
    const isShowSearchEngine = function() {
        return showingSearchEngine;
    };
    const isShowRssReader = function() {
        return showingRssReader;
    };
    const isShowLogViewer = function() {
        return showingLogViewer;
    };

    return exports();
})();
Object.freeze(window.qBittorrent.Client);

this.torrentsTable = new window.qBittorrent.DynamicTable.TorrentsTable();

let updatePropertiesPanel = function() {};

this.updateMainData = function() {};
let alternativeSpeedLimits = false;
let queueing_enabled = true;
let serverSyncMainDataInterval = 1500;
let customSyncMainDataInterval = null;
let useSubcategories = true;
let searchTabInitialized = false;
let rssTabInitialized = false;
let logTabInitialized = false;

const useAutoHideZeroStatusFilters = LocalPreferences.get("hide_zero_status_filters", "false") === "true";
const displayFullURLTrackerColumn = LocalPreferences.get("full_url_tracker_column", "false") === "true";

let syncRequestInProgress = false;

let clipboardEvent;

/* Categories filter */
const CATEGORIES_ALL = 1;
const CATEGORIES_UNCATEGORIZED = 2;

const category_list = new Map();

let selectedCategory = Number(LocalPreferences.get("selected_category", CATEGORIES_ALL));
let setCategoryFilter = function() {};

/* Tags filter */
const TAGS_ALL = 1;
const TAGS_UNTAGGED = 2;

const tagList = new Map();

let selectedTag = Number(LocalPreferences.get("selected_tag", TAGS_ALL));
let setTagFilter = function() {};

/* Trackers filter */
const TRACKERS_ALL = 1;
const TRACKERS_TRACKERLESS = 2;

/** @type Map<number, {host: string, trackerTorrentMap: Map<string, string[]>}> **/
const trackerList = new Map();

let selectedTracker = Number(LocalPreferences.get("selected_tracker", TRACKERS_ALL));
let setTrackerFilter = function() {};

/* All filters */
let selectedStatus = LocalPreferences.get("selected_filter", "all");
let setStatusFilter = function() {};
let toggleFilterDisplay = function() {};

const getShowFiltersSidebar = function() {
    // Show Filters Sidebar is enabled by default
    const show = LocalPreferences.get('show_filters_sidebar');
    return (show === null) || (show === 'true');
};

let stopped = false;
const isStopped = () => {
    return stopped;
};

const stop = () => {
    stopped = true;
};

// getHost emulate the GUI version `QString getHost(const QString &url)`
function getHost(url) {
    // We want the hostname.
    // If failed to parse the domain, original input should be returned

    if (!/^(?:https?|udp):/i.test(url)) {
        return url;
    }

    try {
        // hack: URL can not get hostname from udp protocol
        const parsedUrl = new URL(url.replace(/^udp:/i, 'https:'));
        // host: "example.com:8443"
        // hostname: "example.com"
        const host = parsedUrl.hostname;
        if (!host) {
            return url;
        }

        return host;
    }
    catch (error) {
        return url;
    }
}

function genHash(string) {
    // origins:
    // https://stackoverflow.com/a/8831937
    // https://gist.github.com/hyamamoto/fd435505d29ebfa3d9716fd2be8d42f0
    let hash = 0;
    for (let i = 0; i < string.length; ++i)
        hash = ((Math.imul(hash, 31) + string.charCodeAt(i)) | 0);
    return hash;
}

function getSyncMainDataInterval() {
    return customSyncMainDataInterval ? customSyncMainDataInterval : serverSyncMainDataInterval;
}

const fetchQbtVersion = function() {
    new Request({
        url: 'api/v2/app/version',
        method: 'get',
        onSuccess: function(info) {
            if (!info)
                return;
            sessionStorage.setItem('qbtVersion', info);
        }
    }).send();
};
fetchQbtVersion();

const qbtVersion = function() {
    const version = sessionStorage.getItem('qbtVersion');
    if (!version)
        return '';
    return version;
};

window.addEvent('load', function() {
    const saveColumnSizes = function() {
        const filters_width = $('Filters').getSize().x;
        const properties_height_rel = $('propertiesPanel').getSize().y / Window.getSize().y;
        LocalPreferences.set('filters_width', filters_width);
        LocalPreferences.set('properties_height_rel', properties_height_rel);
    };

    window.addEvent('resize', function() {
        // only save sizes if the columns are visible
        if (!$("mainColumn").hasClass("invisible"))
            saveColumnSizes.delay(200); // Resizing might takes some time.
    });

    MochaUI.Desktop.initialize();

    const buildTransfersTab = function() {
        let filt_w = LocalPreferences.get('filters_width');
        if ($defined(filt_w))
            filt_w = filt_w.toInt();
        else
            filt_w = 120;
        new MochaUI.Column({
            id: 'filtersColumn',
            placement: 'left',
            onResize: saveColumnSizes,
            width: filt_w,
            resizeLimit: [1, 300]
        });

        new MochaUI.Column({
            id: 'mainColumn',
            placement: 'main'
        });
    };

    const buildSearchTab = function() {
        new MochaUI.Column({
            id: 'searchTabColumn',
            placement: 'main',
            width: null
        });

        // start off hidden
        $("searchTabColumn").addClass("invisible");
    };

    const buildRssTab = function() {
        new MochaUI.Column({
            id: 'rssTabColumn',
            placement: 'main',
            width: null
        });

        // start off hidden
        $("rssTabColumn").addClass("invisible");
    };

    const buildLogTab = function() {
        new MochaUI.Column({
            id: 'logTabColumn',
            placement: 'main',
            width: null
        });

        // start off hidden
        $('logTabColumn').addClass('invisible');
    };

    buildTransfersTab();
    buildSearchTab();
    buildRssTab();
    buildLogTab();
    MochaUI.initializeTabs('mainWindowTabsList');

    setStatusFilter = function(name) {
        LocalPreferences.set("selected_filter", name);
        selectedStatus = name;
        highlightSelectedStatus();
        updateMainData();
    };

    setCategoryFilter = function(hash) {
        LocalPreferences.set("selected_category", hash);
        selectedCategory = Number(hash);
        highlightSelectedCategory();
        updateMainData();
    };

    setTagFilter = function(hash) {
        LocalPreferences.set("selected_tag", hash);
        selectedTag = Number(hash);
        highlightSelectedTag();
        updateMainData();
    };

    setTrackerFilter = function(hash) {
        LocalPreferences.set("selected_tracker", hash);
        selectedTracker = Number(hash);
        highlightSelectedTracker();
        updateMainData();
    };

    toggleFilterDisplay = function(filterListID) {
        const filterList = document.getElementById(filterListID);
        const filterTitle = filterList.previousElementSibling;
        const toggleIcon = filterTitle.firstElementChild;
        toggleIcon.classList.toggle("rotate");
        LocalPreferences.set(`filter_${filterListID.replace("FilterList", "")}_collapsed`, filterList.classList.toggle("invisible").toString());
    };

    const highlightSelectedStatus = function() {
        const statusFilter = document.getElementById("statusFilterList");
        const filterID = `${selectedStatus}_filter`;
        for (const status of statusFilter.children)
            status.classList.toggle("selectedFilter", (status.id === filterID));
    };

    new MochaUI.Panel({
        id: 'Filters',
        title: 'Panel',
        header: false,
        padding: {
            top: 0,
            right: 0,
            bottom: 0,
            left: 0
        },
        loadMethod: 'xhr',
        contentURL: 'views/filters.html',
        onContentLoaded: function() {
            highlightSelectedStatus();
        },
        column: 'filtersColumn',
        height: 300
    });
    initializeWindows();

    // Show Top Toolbar is enabled by default
    let showTopToolbar = true;
    if (LocalPreferences.get('show_top_toolbar') !== null)
        showTopToolbar = LocalPreferences.get('show_top_toolbar') == "true";
    if (!showTopToolbar) {
        $('showTopToolbarLink').firstChild.style.opacity = '0';
        $('mochaToolbar').addClass('invisible');
    }

    // Show Status Bar is enabled by default
    let showStatusBar = true;
    if (LocalPreferences.get('show_status_bar') !== null)
        showStatusBar = LocalPreferences.get('show_status_bar') === "true";
    if (!showStatusBar) {
        $('showStatusBarLink').firstChild.style.opacity = '0';
        $('desktopFooterWrapper').addClass('invisible');
    }

    const showFiltersSidebar = getShowFiltersSidebar();
    if (!showFiltersSidebar) {
        $('showFiltersSidebarLink').firstChild.style.opacity = '0';
        $('filtersColumn').addClass('invisible');
        $('filtersColumn_handle').addClass('invisible');
    }

    let speedInTitle = LocalPreferences.get('speed_in_browser_title_bar') == "true";
    if (!speedInTitle)
        $('speedInBrowserTitleBarLink').firstChild.style.opacity = '0';

    // After showing/hiding the toolbar + status bar
    let showSearchEngine = LocalPreferences.get('show_search_engine') !== "false";
    let showRssReader = LocalPreferences.get('show_rss_reader') !== "false";
    let showLogViewer = LocalPreferences.get('show_log_viewer') === 'true';

    // After Show Top Toolbar
    MochaUI.Desktop.setDesktopSize();

    let syncMainDataLastResponseId = 0;
    const serverState = {};

    const removeTorrentFromCategoryList = function(hash) {
        if (hash === null || hash === "")
            return false;
        let removed = false;
        Object.each(category_list, function(category) {
            if (Object.contains(category.torrents, hash)) {
                removed = true;
                category.torrents.splice(category.torrents.indexOf(hash), 1);
            }
        });
        return removed;
    };

    const addTorrentToCategoryList = function(torrent) {
        const category = torrent['category'];
        if (typeof category === 'undefined')
            return false;
        if (category.length === 0) { // Empty category
            removeTorrentFromCategoryList(torrent['hash']);
            return true;
        }
        const categoryHash = genHash(category);
        if (!category_list[categoryHash]) // This should not happen
            category_list[categoryHash] = {
                name: category,
                torrents: []
            };
        if (!Object.contains(category_list[categoryHash].torrents, torrent['hash'])) {
            removeTorrentFromCategoryList(torrent['hash']);
            category_list[categoryHash].torrents = category_list[categoryHash].torrents.combine([torrent['hash']]);
            return true;
        }
        return false;
    };

    const removeTorrentFromTagList = function(hash) {
        if ((hash === null) || (hash === ""))
            return false;

        let removed = false;
        for (const key in tagList) {
            const tag = tagList[key];
            if (Object.contains(tag.torrents, hash)) {
                removed = true;
                tag.torrents.splice(tag.torrents.indexOf(hash), 1);
            }
        }
        return removed;
    };

    const addTorrentToTagList = function(torrent) {
        if (torrent["tags"] === undefined) // Tags haven't changed
            return false;

        const hash = torrent["hash"];
        removeTorrentFromTagList(hash);

        if (torrent["tags"].length === 0) // No tags
            return true;

        const tags = torrent["tags"].split(",");
        let added = false;
        for (let i = 0; i < tags.length; ++i) {
            const tagHash = window.qBittorrent.Misc.genHash(tags[i].trim());
            if (!tagList.has(tagHash)) { // This should not happen
                tagList.set(tagHash, {
                    name: tags,
                    torrents: new Set()
                });
            }

            const torrents = tagList.get(tagHash).torrents;
            if (!torrents.has(hash)) {
                torrents.add(hash);
                added = true;
            }
        }
        return added;
    };

    const updateFilter = function(filter, filterTitle) {
        const filterEl = document.getElementById(`${filter}_filter`);
        const filterTorrentCount = torrentsTable.getFilteredTorrentsNumber(filter, CATEGORIES_ALL, TAGS_ALL, TRACKERS_ALL);
        if (useAutoHideZeroStatusFilters) {
            const hideFilter = (filterTorrentCount === 0) && (filter !== "all");
            if (filterEl.classList.toggle("invisible", hideFilter))
                return;
        }
        filterEl.firstElementChild.lastChild.nodeValue = filterTitle.replace("%1", filterTorrentCount);
    };

    const updateFiltersList = function() {
        updateFilter('all', 'All (%1)');
        updateFilter('downloading', 'Downloading (%1)');
        updateFilter('seeding', 'Seeding (%1)');
        updateFilter('completed', 'Completed (%1)');
        updateFilter("running", "Running (%1)");
        updateFilter("stopped", "Stopped (%1)");
        updateFilter('active', 'Active (%1)');
        updateFilter('inactive', 'Inactive (%1)');
        updateFilter('stalled', 'Stalled (%1)');
        updateFilter('stalled_uploading', 'Stalled Uploading (%1)');
        updateFilter('stalled_downloading', 'Stalled Downloading (%1)');
        updateFilter('checking', 'Checking (%1)');
	    updateFilter('moving', 'Moving (%1)');
        updateFilter('errored', 'Errored (%1)');
    };

    const updateCategoryList = function() {
        const categoryList = document.getElementById("categoryFilterList");
        if (!categoryList)
            return;
        categoryList.getChildren().each(c => c.destroy());

        const categoryItemTemplate = document.getElementById("categoryFilterItem");

        const createCategoryLink = (hash, name, count) => {
            const categoryFilterItem = categoryItemTemplate.content.cloneNode(true).firstElementChild;
            categoryFilterItem.id = hash;
            categoryFilterItem.classList.toggle("selectedFilter", hash === selectedCategory);

            const span = categoryFilterItem.firstElementChild;
            span.lastElementChild.textContent = `${name} (${count})`;

            return categoryFilterItem;
        };

        const createCategoryTree = (category) => {
            const stack = [{ parent: categoriesFragment, category: category }];
            while (stack.length > 0) {
                const { parent, category } = stack.pop();
                const displayName = category.nameSegments.at(-1);
                const listItem = createCategoryLink(category.categoryHash, displayName, category.categoryCount);
                listItem.firstElementChild.style.paddingLeft = `${(category.nameSegments.length - 1) * 20 + 6}px`;

                parent.appendChild(listItem);

                if (category.children.length > 0) {
                    listItem.querySelector(".categoryToggle").style.visibility = "visible";
                    const unorderedList = document.createElement("ul");
                    listItem.appendChild(unorderedList);
                    for (const subcategory of category.children.reverse())
                        stack.push({ parent: unorderedList, category: subcategory });
                }
                const categoryLocalPref = `category_${category.categoryHash}_collapsed`;
                const isCollapsed = !category.forceExpand && (LocalPreferences.get(categoryLocalPref, "false") === "true");
                LocalPreferences.set(categoryLocalPref, listItem.classList.toggle("collapsedCategory", isCollapsed).toString());
            }
        };

        let uncategorized = 0;
        for (const { full_data: { category } } of torrentsTable.getRowValues()) {
            if (category.length === 0)
                uncategorized += 1;
        }

        const sortedCategories = [];
        category_list.forEach((category, hash) => sortedCategories.push({
            categoryName: category.name,
            categoryHash: hash,
            categoryCount: category.torrents.size,
            nameSegments: category.name.split("/"),
            ...(useSubcategories && {
                children: [],
                parentID: null,
                forceExpand: LocalPreferences.get(`category_${hash}_collapsed`) === null
            })
        }));
        sortedCategories.sort((left, right) => {
            const leftSegments = left.nameSegments;
            const rightSegments = right.nameSegments;

            for (let i = 0, iMax = Math.min(leftSegments.length, rightSegments.length); i < iMax; ++i) {
                const compareResult = window.qBittorrent.Misc.naturalSortCollator.compare(
                    leftSegments[i], rightSegments[i]);
                if (compareResult !== 0)
                    return compareResult;
            }

            return leftSegments.length - rightSegments.length;
        });

        const categoriesFragment = new DocumentFragment();
        categoriesFragment.appendChild(createCategoryLink(CATEGORIES_ALL, "All", torrentsTable.getRowSize()));
        categoriesFragment.appendChild(createCategoryLink(CATEGORIES_UNCATEGORIZED, "Uncategorized", uncategorized));

        if (useSubcategories) {
            categoryList.classList.add("subcategories");
            for (let i = 0; i < sortedCategories.length; ++i) {
                const category = sortedCategories[i];
                for (let j = (i + 1);
                    ((j < sortedCategories.length) && sortedCategories[j].categoryName.startsWith(`${category.categoryName}/`)); ++j) {
                    const subcategory = sortedCategories[j];
                    category.categoryCount += subcategory.categoryCount;
                    category.forceExpand ||= subcategory.forceExpand;

                    const isDirectSubcategory = (subcategory.nameSegments.length - category.nameSegments.length) === 1;
                    if (isDirectSubcategory) {
                        subcategory.parentID = category.categoryHash;
                        category.children.push(subcategory);
                    }
                }
            }
            for (const category of sortedCategories) {
                if (category.parentID === null)
                    createCategoryTree(category);
            }
        }
        else {
            categoryList.classList.remove("subcategories");
            for (const { categoryHash, categoryName, categoryCount } of sortedCategories)
                categoriesFragment.appendChild(createCategoryLink(categoryHash, categoryName, categoryCount));
        }

        categoryList.appendChild(categoriesFragment);
        window.qBittorrent.Filters.categoriesFilterContextMenu.searchAndAddTargets();
    };

    const highlightSelectedCategory = function() {
        const categoryList = document.getElementById("categoryFilterList");
        if (!categoryList)
            return;

        for (const category of categoryList.getElementsByTagName("li"))
            category.classList.toggle("selectedFilter", (Number(category.id) === selectedCategory));
    };

    const updateTagList = function() {
        const tagFilterList = $('tagFilterList');
        if (tagFilterList === null)
            return;

        tagFilterList.getChildren().each(c => c.destroy());

        const createLink = function(hash, text, count) {
            const html = '<a href="#" onclick="setTagFilter(' + hash + ');return false;">'
                + '<img src="images/tags.svg"/>'
                + window.qBittorrent.Misc.escapeHtml(text) + ' (' + count + ')' + '</a>';
            const el = new Element('li', {
                id: hash,
                html: html
            });
            window.qBittorrent.Filters.tagsFilterContextMenu.addTarget(el);
            return el;
        };

        const torrentsCount = torrentsTable.getRowIds().length;
        let untagged = 0;
        for (const key in torrentsTable.rows) {
            if (Object.prototype.hasOwnProperty.call(torrentsTable.rows, key) && (torrentsTable.rows[key]['full_data'].tags.length === 0))
                untagged += 1;
        }
        tagFilterList.appendChild(createLink(TAGS_ALL, 'All', torrentsCount));
        tagFilterList.appendChild(createLink(TAGS_UNTAGGED, 'Untagged', untagged));

        const sortedTags = [];
        for (const key in tagList)
            sortedTags.push(tagList[key].name);
        sortedTags.sort();

        for (let i = 0; i < sortedTags.length; ++i) {
            const tagName = sortedTags[i];
            const tagHash = genHash(tagName);
            const tagCount = tagList[tagHash].torrents.length;
            tagFilterList.appendChild(createLink(tagHash, tagName, tagCount));
        }

        highlightSelectedTag();
    };

    const highlightSelectedTag = function() {
        const tagFilterList = $('tagFilterList');
        if (!tagFilterList)
            return;

        const children = tagFilterList.childNodes;
        for (let i = 0; i < children.length; ++i)
            children[i].className = (children[i].id === selectedTag) ? "selectedFilter" : "";
    };

    const updateTrackerList = function() {
        const trackerFilterList = $("trackerFilterList");
        if (trackerFilterList === null)
            return;

        trackerFilterList.getChildren().each(c => c.destroy());

        const trackerItemTemplate = document.getElementById("trackerFilterItem");

        const createLink = function(hash, text, count) {
            const trackerFilterItem = trackerItemTemplate.content.cloneNode(true).firstElementChild;
            trackerFilterItem.id = hash;
            trackerFilterItem.classList.toggle("selectedFilter", hash === selectedTracker);

            const span = trackerFilterItem.firstElementChild;
            span.lastChild.textContent = text.replace("%1", count);

            return trackerFilterItem;
        };

        let trackerlessTorrentsCount = 0;
        for (const { full_data: { trackers_count: trackersCount } } of torrentsTable.getRowValues()) {
            if (trackersCount === 0)
                trackerlessTorrentsCount += 1;
        }

        trackerFilterList.appendChild(createLink(TRACKERS_ALL, "All (%1)", torrentsTable.getRowSize()));
        trackerFilterList.appendChild(createLink(TRACKERS_TRACKERLESS, "Trackerless (%1)", trackerlessTorrentsCount));

        // Remove unused trackers
        for (const [key, { trackerTorrentMap }] of trackerList) {
            if (trackerTorrentMap.size === 0)
                trackerList.delete(key);
        }

        // Sort trackers by hostname
        const sortedList = [];
        trackerList.forEach(({ host, trackerTorrentMap }, hash) => {
            const uniqueTorrents = new Set();
            for (const torrents of trackerTorrentMap.values()) {
                for (const torrent of torrents)
                    uniqueTorrents.add(torrent);
            }

            sortedList.push({
                trackerHost: host,
                trackerHash: hash,
                trackerCount: uniqueTorrents.size,
            });
        });
        sortedList.sort((left, right) => window.qBittorrent.Misc.naturalSortCollator.compare(left.trackerHost, right.trackerHost));
        for (const { trackerHost, trackerHash, trackerCount } of sortedList)
            trackerFilterList.appendChild(createLink(trackerHash, (trackerHost + " (%1)"), trackerCount));

        window.qBittorrent.Filters.trackersFilterContextMenu.searchAndAddTargets();
    };

    const highlightSelectedTracker = function() {
        const trackerFilterList = $('trackerFilterList');
        if (!trackerFilterList)
            return;

        const children = trackerFilterList.childNodes;
        for (const child of children)
            child.className = (child.id === selectedTracker) ? "selectedFilter" : "";
    };

    let syncMainDataTimeoutID = -1;
    let syncRequestInProgress = false;
    const syncMainData = function() {
        const url = new URI("api/v2/sync/maindata");
        url.setData("rid", syncMainDataLastResponseId);
        const request = new Request.JSON({
            url: url,
            noCache: true,
            method: "get",
            onFailure: function() {
                const errorDiv = $("error_div");
                if (errorDiv)
                    errorDiv.textContent = "qBittorrent client is not reachable";
                syncRequestInProgress = false;
                syncData(2000);
            },
            onSuccess: function(response) {
                $("error_div").textContent = "";
                if (response) {
                    clearTimeout(torrentsFilterInputTimer);
                    torrentsFilterInputTimer = -1;

                    let torrentsTableSelectedRows;
                    let update_categories = false;
                    let updateTags = false;
                    let updateTrackers = false;
                    const full_update = (response["full_update"] === true);
                    if (full_update) {
                        torrentsTableSelectedRows = torrentsTable.selectedRowsIds();
                        update_categories = true;
                        updateTags = true;
                        updateTrackers = true;
                        torrentsTable.clear();
                        category_list.clear();
                        tagList.clear();
                        trackerList.clear();
                    }
                    if (response["rid"])
                        syncMainDataLastResponseId = response["rid"];
                    if (response["categories"]) {
                        for (const key in response["categories"]) {
                            if (!Object.hasOwn(response["categories"], key))
                                continue;

                            const responseCategory = response["categories"][key];
                            const categoryHash = window.qBittorrent.Misc.genHash(key);
                            const category = category_list.get(categoryHash);
                            if (category !== undefined) {
                                // only the save path can change for existing categories
                                category.savePath = responseCategory.savePath;
                            }
                            else {
                                category_list.set(categoryHash, {
                                    name: responseCategory.name,
                                    savePath: responseCategory.savePath,
                                    torrents: new Set()
                                });
                            }
                        }
                        update_categories = true;
                    }
                    if (response["categories_removed"]) {
                        response["categories_removed"].each((category) => {
                            const categoryHash = window.qBittorrent.Misc.genHash(category);
                            category_list.delete(categoryHash);
                        });
                        update_categories = true;
                    }
                    if (response["tags"]) {
                        for (const tag of response["tags"]) {
                            const tagHash = window.qBittorrent.Misc.genHash(tag);
                            if (!tagList.has(tagHash)) {
                                tagList.set(tagHash, {
                                    name: tag,
                                    torrents: new Set()
                                });
                            }
                        }
                        updateTags = true;
                    }
                    if (response["tags_removed"]) {
                        for (let i = 0; i < response["tags_removed"].length; ++i) {
                            const tagHash = window.qBittorrent.Misc.genHash(response["tags_removed"][i]);
                            tagList.delete(tagHash);
                        }
                        updateTags = true;
                    }
                    if (response["trackers"]) {
                        for (const [tracker, torrents] of Object.entries(response["trackers"])) {
                            const host = window.qBittorrent.Misc.getHost(tracker);
                            const hash = window.qBittorrent.Misc.genHash(host);

                            let trackerListItem = trackerList.get(hash);
                            if (trackerListItem === undefined) {
                                trackerListItem = { host: host, trackerTorrentMap: new Map() };
                                trackerList.set(hash, trackerListItem);
                            }
                            trackerListItem.trackerTorrentMap.set(tracker, new Set(torrents));
                        }
                        updateTrackers = true;
                    }
                    if (response["trackers_removed"]) {
                        for (let i = 0; i < response["trackers_removed"].length; ++i) {
                            const tracker = response["trackers_removed"][i];
                            const host = window.qBittorrent.Misc.getHost(tracker);
                            const hash = window.qBittorrent.Misc.genHash(host);
                            const trackerListEntry = trackerList.get(hash);
                            if (trackerListEntry)
                                trackerListEntry.trackerTorrentMap.delete(tracker);
                        }
                        updateTrackers = true;
                    }
                    if (response["torrents"]) {
                        let updateTorrentList = false;
                        for (const key in response["torrents"]) {
                            if (!Object.hasOwn(response["torrents"], key))
                                continue;

                            response["torrents"][key]["hash"] = key;
                            response["torrents"][key]["rowId"] = key;
                            if (response["torrents"][key]["state"])
                                response["torrents"][key]["status"] = response["torrents"][key]["state"];
                            torrentsTable.updateRowData(response["torrents"][key]);
                            if (addTorrentToCategoryList(response["torrents"][key]))
                                update_categories = true;
                            if (addTorrentToTagList(response["torrents"][key]))
                                updateTags = true;
                            if (response["torrents"][key]["name"])
                                updateTorrentList = true;
                        }

                        if (updateTorrentList)
                            setupCopyEventHandler();
                    }
                    if (response["torrents_removed"]) {
                        response["torrents_removed"].each((hash) => {
                            torrentsTable.removeRow(hash);
                            removeTorrentFromCategoryList(hash);
                            update_categories = true; // Always to update All category
                            removeTorrentFromTagList(hash);
                            updateTags = true; // Always to update All tag
                        });
                    }
                    torrentsTable.updateTable(full_update);
                    if (response["server_state"]) {
                        const tmp = response["server_state"];
                        for (const k in tmp) {
                            if (!Object.hasOwn(tmp, k))
                                continue;
                            serverState[k] = tmp[k];
                        }
                        processServerState();
                    }
                    updateFiltersList();
                    if (update_categories) {
                        updateCategoryList();
                        window.qBittorrent.TransferList.contextMenu.updateCategoriesSubMenu(category_list);
                    }
                    if (updateTags) {
                        updateTagList();
                        window.qBittorrent.TransferList.contextMenu.updateTagsSubMenu(tagList);
                    }
                    if (updateTrackers)
                        updateTrackerList();

                    if (full_update)
                        // re-select previously selected rows
                        torrentsTable.reselectRows(torrentsTableSelectedRows);
                }
                syncRequestInProgress = false;
                syncData(window.qBittorrent.Client.getSyncMainDataInterval());
            }
        });
        syncRequestInProgress = true;
        request.send();
    };

    updateMainData = function() {
        torrentsTable.updateTable();
        syncData(100);
    };

    const syncData = function(delay) {
        if (syncRequestInProgress)
            return;

        clearTimeout(syncMainDataTimeoutID);
        syncMainDataTimeoutID = -1;

        if (window.qBittorrent.Client.isStopped())
            return;

        syncMainDataTimeoutID = syncMainData.delay(delay);
    };

    const processServerState = function() {
        let transfer_info = window.qBittorrent.Misc.friendlyUnit(serverState.dl_info_speed, true);
        if (serverState.dl_rate_limit > 0)
            transfer_info += " [" + window.qBittorrent.Misc.friendlyUnit(serverState.dl_rate_limit, true) + "]";
        transfer_info += " (" + window.qBittorrent.Misc.friendlyUnit(serverState.dl_info_data, false) + ")";
        $("DlInfos").set('html', transfer_info);
        transfer_info = window.qBittorrent.Misc.friendlyUnit(serverState.up_info_speed, true);
        if (serverState.up_rate_limit > 0)
            transfer_info += " [" + window.qBittorrent.Misc.friendlyUnit(serverState.up_rate_limit, true) + "]";
        transfer_info += " (" + window.qBittorrent.Misc.friendlyUnit(serverState.up_info_data, false) + ")";
        $("UpInfos").set('html', transfer_info);
        if (speedInTitle) {
            document.title = "[D: %1, U: %2] qBittorrent %3".replace("%1", window.qBittorrent.Misc.friendlyUnit(serverState.dl_info_speed, true)).replace("%2", window.qBittorrent.Misc.friendlyUnit(serverState.up_info_speed, true)).replace("%3", qbtVersion());
            document.title += " Web UI";
        }
        else
            document.title = ("qBittorrent " + qbtVersion() + " Web UI");

        let totalSize = 0;
        for (const tr in torrentsTable.rows) {
            if (torrentsTable.rows[tr].full_data){
                totalSize += torrentsTable.rows[tr].full_data.size;
            }
        }
        
        $('torrentsTotalSize').set('html', 'Total Downloads: %1 (%2\%)'.replace("%1", window.qBittorrent.Misc.friendlyUnit(totalSize)).replace("%2", ((totalSize/(totalSize + serverState.free_space_on_disk))*100).toFixed(2)));
        $('freeSpaceOnDisk').set('html', 'Free space: %1'.replace("%1", window.qBittorrent.Misc.friendlyUnit(serverState.free_space_on_disk)));
        $('DHTNodes').set('html', 'DHT: %1 nodes'.replace("%1", serverState.dht_nodes));

        // Statistics dialog
        if (document.getElementById("statisticsContent")) {
            $('AlltimeDL').set('html', window.qBittorrent.Misc.friendlyUnit(serverState.alltime_dl, false));
            $('AlltimeUL').set('html', window.qBittorrent.Misc.friendlyUnit(serverState.alltime_ul, false));
            $('TotalWastedSession').set('html', window.qBittorrent.Misc.friendlyUnit(serverState.total_wasted_session, false));
            $('GlobalRatio').set('html', serverState.global_ratio);
            $('TotalPeerConnections').set('html', serverState.total_peer_connections);
            $('ReadCacheHits').set('html', serverState.read_cache_hits + "%");
            $('TotalBuffersSize').set('html', window.qBittorrent.Misc.friendlyUnit(serverState.total_buffers_size, false));
            $('WriteCacheOverload').set('html', serverState.write_cache_overload + "%");
            $('ReadCacheOverload').set('html', serverState.read_cache_overload + "%");
            $('QueuedIOJobs').set('html', serverState.queued_io_jobs);
            $('AverageTimeInQueue').set('html', serverState.average_time_queue + " ms");
            $('TotalQueuedSize').set('html', window.qBittorrent.Misc.friendlyUnit(serverState.total_queued_size, false));
        }

        switch (serverState.connection_status) {
            case 'connected':
                $('connectionStatus').src = 'images/connected.svg';
                $('connectionStatus').alt = 'Connection status: Connected';
                $('connectionStatus').title = 'Connection status: Connected';
                break;
            case 'firewalled':
                $('connectionStatus').src = 'images/firewalled.svg';
                $('connectionStatus').alt = 'Connection status: Firewalled';
                $('connectionStatus').title = 'Connection status: Firewalled';
                break;
            default:
                $('connectionStatus').src = 'images/disconnected.svg';
                $('connectionStatus').alt = 'Connection status: Disconnected';
                $('connectionStatus').title = 'Connection status: Disconnected';
                break;
        }

        if (queueing_enabled != serverState.queueing) {
            queueing_enabled = serverState.queueing;
            torrentsTable.columns['priority'].force_hide = !queueing_enabled;
            torrentsTable.updateColumn('priority');
            if (queueing_enabled) {
                $('topQueuePosItem').removeClass('invisible');
                $('increaseQueuePosItem').removeClass('invisible');
                $('decreaseQueuePosItem').removeClass('invisible');
                $('bottomQueuePosItem').removeClass('invisible');
                $('queueingButtons').removeClass('invisible');
                $('queueingMenuItems').removeClass('invisible');
            }
            else {
                $('topQueuePosItem').addClass('invisible');
                $('increaseQueuePosItem').addClass('invisible');
                $('decreaseQueuePosItem').addClass('invisible');
                $('bottomQueuePosItem').addClass('invisible');
                $('queueingButtons').addClass('invisible');
                $('queueingMenuItems').addClass('invisible');
            }
        }

        if (alternativeSpeedLimits != serverState.use_alt_speed_limits) {
            alternativeSpeedLimits = serverState.use_alt_speed_limits;
            updateAltSpeedIcon(alternativeSpeedLimits);
        }

        if (useSubcategories != serverState.use_subcategories) {
            useSubcategories = serverState.use_subcategories;
            updateCategoryList();
        }

        serverSyncMainDataInterval = Math.max(serverState.refresh_interval, 500);
    };

    const updateAltSpeedIcon = function(enabled) {
        if (enabled) {
            $('alternativeSpeedLimits').src = 'images/slow.svg';
            $('alternativeSpeedLimits').alt = 'Alternative speed limits: On';
            $('alternativeSpeedLimits').title = 'Alternative speed limits: On';
        }
        else {
            $('alternativeSpeedLimits').src = 'images/slow_off.svg';
            $('alternativeSpeedLimits').alt = 'Alternative speed limits: Off';
            $('alternativeSpeedLimits').title = 'Alternative speed limits: Off';
        }
    };

    $('alternativeSpeedLimits').addEvent('click', function() {
        // Change icon immediately to give some feedback
        updateAltSpeedIcon(!alternativeSpeedLimits);

        new Request({
            url: 'api/v2/transfer/toggleSpeedLimitsMode',
            method: 'post',
            onComplete: function() {
                alternativeSpeedLimits = !alternativeSpeedLimits;
                updateMainData();
            },
            onFailure: function() {
                // Restore icon in case of failure
                updateAltSpeedIcon(alternativeSpeedLimits);
            }
        }).send();
    });

    $('DlInfos').addEvent('click', globalDownloadLimitFN);
    $('UpInfos').addEvent('click', globalUploadLimitFN);

    $('showTopToolbarLink').addEvent('click', function(e) {
        showTopToolbar = !showTopToolbar;
        LocalPreferences.set('show_top_toolbar', showTopToolbar.toString());
        if (showTopToolbar) {
            $('showTopToolbarLink').firstChild.style.opacity = '1';
            $('mochaToolbar').removeClass('invisible');
        }
        else {
            $('showTopToolbarLink').firstChild.style.opacity = '0';
            $('mochaToolbar').addClass('invisible');
        }
        MochaUI.Desktop.setDesktopSize();
    });

    $('showStatusBarLink').addEvent('click', function(e) {
        showStatusBar = !showStatusBar;
        LocalPreferences.set('show_status_bar', showStatusBar.toString());
        if (showStatusBar) {
            $('showStatusBarLink').firstChild.style.opacity = '1';
            $('desktopFooterWrapper').removeClass('invisible');
        }
        else {
            $('showStatusBarLink').firstChild.style.opacity = '0';
            $('desktopFooterWrapper').addClass('invisible');
        }
        MochaUI.Desktop.setDesktopSize();
    });

    $('registerMagnetHandlerLink').addEvent('click', function(e) {
        registerMagnetHandler();
    });

    $('showFiltersSidebarLink').addEvent('click', function(e) {
        const showFiltersSidebar = !getShowFiltersSidebar();
        LocalPreferences.set('show_filters_sidebar', showFiltersSidebar.toString());
        if (showFiltersSidebar) {
            $('showFiltersSidebarLink').firstChild.style.opacity = '1';
            $('filtersColumn').removeClass('invisible');
            $('filtersColumn_handle').removeClass('invisible');
        }
        else {
            $('showFiltersSidebarLink').firstChild.style.opacity = '0';
            $('filtersColumn').addClass('invisible');
            $('filtersColumn_handle').addClass('invisible');
        }
        MochaUI.Desktop.setDesktopSize();
    });

    $('speedInBrowserTitleBarLink').addEvent('click', function(e) {
        speedInTitle = !speedInTitle;
        LocalPreferences.set('speed_in_browser_title_bar', speedInTitle.toString());
        if (speedInTitle)
            $('speedInBrowserTitleBarLink').firstChild.style.opacity = '1';
        else
            $('speedInBrowserTitleBarLink').firstChild.style.opacity = '0';
        processServerState();
    });

    $('showSearchEngineLink').addEvent('click', function(e) {
        showSearchEngine = !showSearchEngine;
        LocalPreferences.set('show_search_engine', showSearchEngine.toString());
        updateTabDisplay();
    });

    $('showRssReaderLink').addEvent('click', function(e) {
        showRssReader = !showRssReader;
        LocalPreferences.set('show_rss_reader', showRssReader.toString());
        updateTabDisplay();
    });

    $('showLogViewerLink').addEvent('click', function(e) {
        showLogViewer = !showLogViewer;
        LocalPreferences.set('show_log_viewer', showLogViewer.toString());
        updateTabDisplay();
    });

    const updateTabDisplay = function() {
        if (showRssReader) {
            $('showRssReaderLink').firstChild.style.opacity = '1';
            $('mainWindowTabs').removeClass('invisible');
            $('rssTabLink').removeClass('invisible');
            if (!MochaUI.Panels.instances.RssPanel)
                addRssPanel();
        }
        else {
            $('showRssReaderLink').firstChild.style.opacity = '0';
            $('rssTabLink').addClass('invisible');
            if ($('rssTabLink').hasClass('selected'))
                $("transfersTabLink").click();
        }

        if (showSearchEngine) {
            $('showSearchEngineLink').firstChild.style.opacity = '1';
            $('mainWindowTabs').removeClass('invisible');
            $('searchTabLink').removeClass('invisible');
            if (!MochaUI.Panels.instances.SearchPanel)
                addSearchPanel();
        }
        else {
            $('showSearchEngineLink').firstChild.style.opacity = '0';
            $('searchTabLink').addClass('invisible');
            if ($('searchTabLink').hasClass('selected'))
                $("transfersTabLink").click();
        }

        if (showLogViewer) {
            $('showLogViewerLink').firstChild.style.opacity = '1';
            $('mainWindowTabs').removeClass('invisible');
            $('logTabLink').removeClass('invisible');
            if (!MochaUI.Panels.instances.LogPanel)
                addLogPanel();
        }
        else {
            $('showLogViewerLink').firstChild.style.opacity = '0';
            $('logTabLink').addClass('invisible');
            if ($('logTabLink').hasClass('selected'))
                $("transfersTabLink").click();
        }

        // display no tabs
        if (!showRssReader && !showSearchEngine && !showLogViewer)
            $('mainWindowTabs').addClass('invisible');
    };

    $('StatisticsLink').addEvent('click', StatisticsLinkFN);

    // main window tabs

    const showTransfersTab = function() {
        $("filtersColumn").removeClass("invisible");
        $("filtersColumn_handle").removeClass("invisible");
        $("mainColumn").removeClass("invisible");
        $('torrentsFilterToolbar').removeClass("invisible");

        customSyncMainDataInterval = null;
        syncData(100);

        hideSearchTab();
        hideRssTab();
        hideLogTab();
    };

    const hideTransfersTab = function() {
        $("filtersColumn").addClass("invisible");
        $("filtersColumn_handle").addClass("invisible");
        $("mainColumn").addClass("invisible");
        $('torrentsFilterToolbar').addClass("invisible");
        MochaUI.Desktop.resizePanels();
    };

    const showSearchTab = function() {
        if (!searchTabInitialized) {
            window.qBittorrent.Search.init();
            searchTabInitialized = true;
        }

        $("searchTabColumn").removeClass("invisible");
        customSyncMainDataInterval = 30000;
        hideTransfersTab();
        hideRssTab();
        hideLogTab();
    };

    const hideSearchTab = function() {
        $("searchTabColumn").addClass("invisible");
        MochaUI.Desktop.resizePanels();
    };

    const showRssTab = function() {
        if (!rssTabInitialized) {
            window.qBittorrent.Rss.init();
            rssTabInitialized = true;
        }
        else {
            window.qBittorrent.Rss.load();
        }

        $("rssTabColumn").removeClass("invisible");
        customSyncMainDataInterval = 30000;
        hideTransfersTab();
        hideSearchTab();
        hideLogTab();
    };

    const hideRssTab = function() {
        $("rssTabColumn").addClass("invisible");
        window.qBittorrent.Rss && window.qBittorrent.Rss.unload();
        MochaUI.Desktop.resizePanels();
    };

    const showLogTab = function() {
        if (!logTabInitialized) {
            window.qBittorrent.Log.init();
            logTabInitialized = true;
        }
        else {
            window.qBittorrent.Log.load();
        }

        $('logTabColumn').removeClass('invisible');
        customSyncMainDataInterval = 30000;
        hideTransfersTab();
        hideSearchTab();
        hideRssTab();
    };

    const hideLogTab = function() {
        $('logTabColumn').addClass('invisible');
        MochaUI.Desktop.resizePanels();
        window.qBittorrent.Log && window.qBittorrent.Log.unload();
    };

    const addSearchPanel = function() {
        new MochaUI.Panel({
            id: 'SearchPanel',
            title: 'Search',
            header: false,
            padding: {
                top: 0,
                right: 0,
                bottom: 0,
                left: 0
            },
            loadMethod: 'xhr',
            contentURL: 'views/search.html',
            content: '',
            column: 'searchTabColumn',
            height: null
        });
    };

    const addRssPanel = function() {
        new MochaUI.Panel({
            id: 'RssPanel',
            title: 'Rss',
            header: false,
            padding: {
                top: 0,
                right: 0,
                bottom: 0,
                left: 0
            },
            loadMethod: 'xhr',
            contentURL: 'views/rss.html',
            content: '',
            column: 'rssTabColumn',
            height: null
        });
    };

    var addLogPanel = function() {
        new MochaUI.Panel({
            id: 'LogPanel',
            title: 'Log',
            header: true,
            padding: {
                top: 0,
                right: 0,
                bottom: 0,
                left: 0
            },
            loadMethod: 'xhr',
            contentURL: 'views/log.html',
            require: {
                css: ['css/vanillaSelectBox.css'],
                js: ['scripts/lib/vanillaSelectBox.js'],
            },
            tabsURL: 'views/logTabs.html',
            tabsOnload: function() {
                MochaUI.initializeTabs('panelTabs');

                $('logMessageLink').addEvent('click', function(e) {
                    window.qBittorrent.Log.setCurrentTab('main');
                });

                $('logPeerLink').addEvent('click', function(e) {
                    window.qBittorrent.Log.setCurrentTab('peer');
                });
            },
            collapsible: false,
            content: '',
            column: 'logTabColumn',
            height: null
        });
    };

    new MochaUI.Panel({
        id: 'transferList',
        title: 'Panel',
        header: false,
        padding: {
            top: 0,
            right: 0,
            bottom: 0,
            left: 0
        },
        loadMethod: 'xhr',
        contentURL: 'views/transferlist.html',
        onContentLoaded: function() {
            handleDownloadParam();
            updateMainData();
        },
        column: 'mainColumn',
        onResize: saveColumnSizes,
        height: null
    });
    let prop_h = LocalPreferences.get('properties_height_rel');
    if ($defined(prop_h))
        prop_h = prop_h.toFloat() * Window.getSize().y;
    else
        prop_h = Window.getSize().y / 2.0;
    new MochaUI.Panel({
        id: 'propertiesPanel',
        title: 'Panel',
        header: true,
        padding: {
            top: 0,
            right: 0,
            bottom: 0,
            left: 0
        },
        contentURL: 'views/properties.html',
        require: {
            css: ['css/Tabs.css', 'css/dynamicTable.css'],
            js: ['scripts/prop-general.js', 'scripts/prop-trackers.js', 'scripts/prop-peers.js', 'scripts/prop-webseeds.js', 'scripts/prop-files.js'],
        },
        tabsURL: 'views/propertiesToolbar.html',
        tabsOnload: function() {
            MochaUI.initializeTabs('propertiesTabs');

            updatePropertiesPanel = function() {
                if (!$('prop_general').hasClass('invisible')) {
                    if (window.qBittorrent.PropGeneral !== undefined)
                        window.qBittorrent.PropGeneral.updateData();
                }
                else if (!$('prop_trackers').hasClass('invisible')) {
                    if (window.qBittorrent.PropTrackers !== undefined)
                        window.qBittorrent.PropTrackers.updateData();
                }
                else if (!$('prop_peers').hasClass('invisible')) {
                    if (window.qBittorrent.PropPeers !== undefined)
                        window.qBittorrent.PropPeers.updateData();
                }
                else if (!$('prop_webseeds').hasClass('invisible')) {
                    if (window.qBittorrent.PropWebseeds !== undefined)
                        window.qBittorrent.PropWebseeds.updateData();
                }
                else if (!$('prop_files').hasClass('invisible')) {
                    if (window.qBittorrent.PropFiles !== undefined)
                        window.qBittorrent.PropFiles.updateData();
                }
            };

            $('PropGeneralLink').addEvent('click', function(e) {
                $$('.propertiesTabContent').addClass('invisible');
                $('prop_general').removeClass("invisible");
                hideFilesFilter();
                updatePropertiesPanel();
                LocalPreferences.set('selected_tab', this.id);
            });

            $('PropTrackersLink').addEvent('click', function(e) {
                $$('.propertiesTabContent').addClass('invisible');
                $('prop_trackers').removeClass("invisible");
                hideFilesFilter();
                updatePropertiesPanel();
                LocalPreferences.set('selected_tab', this.id);
            });

            $('PropPeersLink').addEvent('click', function(e) {
                $$('.propertiesTabContent').addClass('invisible');
                $('prop_peers').removeClass("invisible");
                hideFilesFilter();
                updatePropertiesPanel();
                LocalPreferences.set('selected_tab', this.id);
            });

            $('PropWebSeedsLink').addEvent('click', function(e) {
                $$('.propertiesTabContent').addClass('invisible');
                $('prop_webseeds').removeClass("invisible");
                hideFilesFilter();
                updatePropertiesPanel();
                LocalPreferences.set('selected_tab', this.id);
            });

            $('PropFilesLink').addEvent('click', function(e) {
                $$('.propertiesTabContent').addClass('invisible');
                $('prop_files').removeClass("invisible");
                showFilesFilter();
                updatePropertiesPanel();
                LocalPreferences.set('selected_tab', this.id);
            });

            $('propertiesPanel_collapseToggle').addEvent('click', function(e) {
                updatePropertiesPanel();
            });
        },
        column: 'mainColumn',
        height: prop_h
    });

    const showFilesFilter = function() {
        $('torrentFilesFilterToolbar').removeClass("invisible");
    };

    const hideFilesFilter = function() {
        $('torrentFilesFilterToolbar').addClass("invisible");
    };

    let prevTorrentsFilterValue;
    let torrentsFilterInputTimer = null;
    // listen for changes to torrentsFilterInput
    $('torrentsFilterInput').addEvent('input', function() {
        const value = $('torrentsFilterInput').get("value");
        if (value !== prevTorrentsFilterValue) {
            prevTorrentsFilterValue = value;
            clearTimeout(torrentsFilterInputTimer);
            torrentsFilterInputTimer = setTimeout(function() {
                torrentsTable.updateTable(false);
            }, 400);
        }
    });

    $('transfersTabLink').addEvent('click', showTransfersTab);
    $('searchTabLink').addEvent('click', showSearchTab);
    $('rssTabLink').addEvent('click', showRssTab);
    $('logTabLink').addEvent('click', showLogTab);
    updateTabDisplay();

    const registerDragAndDrop = () => {
        $('desktop').addEventListener('dragover', (ev) => {
            if (ev.preventDefault)
                ev.preventDefault();
        });

        $('desktop').addEventListener('dragenter', (ev) => {
            if (ev.preventDefault)
                ev.preventDefault();
        });

        $('desktop').addEventListener("drop", (ev) => {
            if (ev.preventDefault)
                ev.preventDefault();

            const droppedFiles = ev.dataTransfer.files;

            if (droppedFiles.length > 0) {
                // dropped files or folders

                // can't handle folder due to cannot put the filelist (from dropped folder)
                // to <input> `files` field
                for (const item of ev.dataTransfer.items) {
                    if (item.webkitGetAsEntry().isDirectory)
                        return;
                }

                const id = 'uploadPage';
                new MochaUI.Window({
                    id: id,
                    title: "Upload local torrent",
                    loadMethod: 'iframe',
                    contentURL: new URI("upload.html").toString(),
                    addClass: 'windowFrame', // fixes iframe scrolling on iOS Safari
                    scrollbars: true,
                    maximizable: false,
                    paddingVertical: 0,
                    paddingHorizontal: 0,
                    width: loadWindowWidth(id, 500),
                    height: loadWindowHeight(id, 460),
                    onResize: () => {
                        saveWindowSize(id);
                    },
                    onContentLoaded: () => {
                        const fileInput = $(`${id}_iframe`).contentDocument.getElementById('fileselect');
                        fileInput.files = droppedFiles;
                    }
                });
            }

            const droppedText = ev.dataTransfer.getData("text");
            if (droppedText.length > 0) {
                // dropped text

                const urls = droppedText.split('\n')
                    .map((str) => str.trim())
                    .filter((str) => {
                        const lowercaseStr = str.toLowerCase();
                        return lowercaseStr.startsWith("http:")
                            || lowercaseStr.startsWith("https:")
                            || lowercaseStr.startsWith("magnet:")
                            || ((str.length === 40) && !(/[^0-9A-Fa-f]/.test(str))) // v1 hex-encoded SHA-1 info-hash
                            || ((str.length === 32) && !(/[^2-7A-Za-z]/.test(str))); // v1 Base32 encoded SHA-1 info-hash
                    });

                if (urls.length <= 0)
                    return;

                const id = 'downloadPage';
                const contentURI = new URI('download.html').setData("urls", urls.map(encodeURIComponent).join("|"));
                new MochaUI.Window({
                    id: id,
                    title: "Download from URLs",
                    loadMethod: 'iframe',
                    contentURL: contentURI.toString(),
                    addClass: 'windowFrame', // fixes iframe scrolling on iOS Safari
                    scrollbars: true,
                    maximizable: false,
                    closable: true,
                    paddingVertical: 0,
                    paddingHorizontal: 0,
                    width: loadWindowWidth(id, 500),
                    height: loadWindowHeight(id, 600),
                    onResize: () => {
                        saveWindowSize(id);
                    }
                });
            }
        });
    };
    registerDragAndDrop();
});

function registerMagnetHandler() {
    if (typeof navigator.registerProtocolHandler !== 'function') {
        if (window.location.protocol !== 'https:')
            alert("To use this feature, the WebUI needs to be accessed over HTTPS");
        else
            alert("Your browser does not support this feature");
        return;
    }

    const hashString = location.hash ? location.hash.replace(/^#/, '') : '';
    const hashParams = new URLSearchParams(hashString);
    hashParams.set('download', '');

    const templateHashString = hashParams.toString().replace('download=', 'download=%s');
    const templateUrl = location.origin + location.pathname
        + location.search + '#' + templateHashString;

    navigator.registerProtocolHandler('magnet', templateUrl,
        'qBittorrent WebUI magnet handler');
}

function handleDownloadParam() {
    // Extract torrent URL from download param in WebUI URL hash
    const downloadHash = "#download=";
    if (location.hash.indexOf(downloadHash) !== 0)
        return;

    const url = decodeURIComponent(location.hash.substring(downloadHash.length));
    // Remove the processed hash from the URL
    history.replaceState('', document.title, (location.pathname + location.search));
    showDownloadPage([url]);
}

function closeWindows() {
    MochaUI.closeAll();
}

function setupCopyEventHandler() {
    if (clipboardEvent)
        clipboardEvent.destroy();

    clipboardEvent = new ClipboardJS('.copyToClipboard', {
        text: function(trigger) {
            switch (trigger.id) {
                case "copyName":
                    return copyNameFN();
                case "copyInfohash1":
                    return copyInfohashFN(1);
                case "copyInfohash2":
                    return copyInfohashFN(2);
                case "copyMagnetLink":
                    return copyMagnetLinkFN();
                case "copyID":
                    return copyIdFN();
                case "copyComment":
                    return copyCommentFN();
                default:
                    return "";
            }
        }
    });
}

new Keyboard({
    defaultEventType: 'keydown',
    events: {
        'ctrl+a': function(event) {
            if (event.target.nodeName == "INPUT" || event.target.nodeName == "TEXTAREA")
                return;
            if (event.target.isContentEditable)
                return;
            torrentsTable.selectAll();
            event.preventDefault();
        },
        'delete': function(event) {
            if (event.target.nodeName == "INPUT" || event.target.nodeName == "TEXTAREA")
                return;
            if (event.target.isContentEditable)
                return;
            deleteFN();
            event.preventDefault();
        },
        'shift+delete': (event) => {
            if (event.target.nodeName == "INPUT" || event.target.nodeName == "TEXTAREA")
                return;
            if (event.target.isContentEditable)
                return;
            deleteFN(true);
            event.preventDefault();
        }
    }
}).activate();
