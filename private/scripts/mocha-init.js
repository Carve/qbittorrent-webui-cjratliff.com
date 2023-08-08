/*
 * Bittorrent Client using Qt and libtorrent.
 * Copyright (C) 2008  Christophe Dumez <chris@qbittorrent.org>
 *
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License
 * as published by the Free Software Foundation; either version 2
 * of the License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
 *
 * In addition, as a special exception, the copyright holders give permission to
 * link this program with the OpenSSL project's "OpenSSL" library (or with
 * modified versions of it that use the same license as the "OpenSSL" library),
 * and distribute the linked executables. You must obey the GNU General Public
 * License in all respects for all of the code used other than "OpenSSL".  If you
 * modify file(s), you may extend this exception to your version of the file(s),
 * but you are not obligated to do so. If you do not wish to do so, delete this
 * exception statement from your version.
 */

/* -----------------------------------------------------------------

    ATTACH MOCHA LINK EVENTS
    Notes: Here is where you define your windows and the events that open them.
    If you are not using links to run Mocha methods you can remove this function.

    If you need to add link events to links within windows you are creating, do
    it in the onContentLoaded function of the new window.

   ----------------------------------------------------------------- */
'use strict';

const LocalPreferences = new window.qBittorrent.LocalPreferences.LocalPreferencesClass();

let saveWindowSize = function() {};
let loadWindowWidth = function() {};
let loadWindowHeight = function() {};
let showDownloadPage = function() {};
let globalUploadLimitFN = function() {};
let uploadLimitFN = function() {};
let shareRatioFN = function() {};
let toggleSequentialDownloadFN = function() {};
let toggleFirstLastPiecePrioFN = function() {};
let setSuperSeedingFN = function() {};
let setForceStartFN = function() {};
let globalDownloadLimitFN = function() {};
let StatisticsLinkFN = function() {};
let downloadLimitFN = function() {};
let deleteFN = function() {};
let pauseFN = function() {};
let startFN = function() {};
let autoTorrentManagementFN = function() {};
let recheckFN = function() {};
let reannounceFN = function() {};
let setLocationFN = function() {};
let renameFN = function() {};
let renameFilesFN = function() {};
let torrentNewCategoryFN = function() {};
let torrentSetCategoryFN = function() {};
let createCategoryFN = function() {};
let createSubcategoryFN = function() {};
let editCategoryFN = function() {};
let removeCategoryFN = function() {};
let deleteUnusedCategoriesFN = function() {};
let startTorrentsByCategoryFN = function() {};
let pauseTorrentsByCategoryFN = function() {};
let deleteTorrentsByCategoryFN = function() {};
let torrentAddTagsFN = function() {};
let torrentSetTagsFN = function() {};
let torrentRemoveAllTagsFN = function() {};
let createTagFN = function() {};
let removeTagFN = function() {};
let deleteUnusedTagsFN = function() {};
let startTorrentsByTagFN = function() {};
let pauseTorrentsByTagFN = function() {};
let deleteTorrentsByTagFN = function() {};
let resumeTorrentsByTrackerFN = function() {};
let pauseTorrentsByTrackerFN = function() {};
let deleteTorrentsByTrackerFN = function() {};
let copyNameFN = function() {};
let copyInfohashFN = function(policy) {};
let copyMagnetLinkFN = function() {};
let copyIdFN = function() {};
let setQueuePositionFN = function() {};
let exportTorrentFN = function() {};

const initializeWindows = function() {
    saveWindowSize = function(windowId) {
        const size = $(windowId).getSize();
        LocalPreferences.set('window_' + windowId + '_width', size.x);
        LocalPreferences.set('window_' + windowId + '_height', size.y);
    };

    loadWindowWidth = function(windowId, defaultValue) {
        return LocalPreferences.get('window_' + windowId + '_width', defaultValue);
    };

    loadWindowHeight = function(windowId, defaultValue) {
        return LocalPreferences.get('window_' + windowId + '_height', defaultValue);
    };

    function addClickEvent(el, fn) {
        ['Link', 'Button'].each(function(item) {
            if ($(el + item)) {
                $(el + item).addEvent('click', fn);
            }
        });
    }

    addClickEvent('download', function(e) {
        new Event(e).stop();
        showDownloadPage();
    });

    showDownloadPage = function(urls) {
        const id = 'downloadPage';
        let contentUri = new URI('download.html');

        if (urls && (urls.length > 0)) {
            contentUri.setData("urls", urls.map(encodeURIComponent).join("|"));
        }

        new MochaUI.Window({
            id: id,
            title: "Download from URLs",
            loadMethod: 'iframe',
            contentURL: contentUri.toString(),
            addClass: 'windowFrame', // fixes iframe scrolling on iOS Safari
            scrollbars: true,
            maximizable: false,
            closable: true,
            paddingVertical: 0,
            paddingHorizontal: 0,
            width: loadWindowWidth(id, 500),
            height: loadWindowHeight(id, 600),
            onResize: function() {
                saveWindowSize(id);
            }
        });
        updateMainData();
    };

    addClickEvent('preferences', function(e) {
        new Event(e).stop();
        const id = 'preferencesPage';
        new MochaUI.Window({
            id: id,
            title: "Options",
            loadMethod: 'xhr',
            toolbar: true,
            contentURL: new URI("views/preferences.html").toString(),
            require: {
                css: ['css/Tabs.css']
            },
            toolbarURL: 'views/preferencesToolbar.html',
            maximizable: false,
            closable: true,
            paddingVertical: 0,
            paddingHorizontal: 0,
            width: loadWindowWidth(id, 700),
            height: loadWindowHeight(id, 600),
            onResize: function() {
                saveWindowSize(id);
            }
        });
    });

    addClickEvent('upload', function(e) {
        new Event(e).stop();
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
            onResize: function() {
                saveWindowSize(id);
            }
        });
        updateMainData();
    });

    globalUploadLimitFN = function() {
        new MochaUI.Window({
            id: 'uploadLimitPage',
            title: "Global Upload Speed Limit",
            loadMethod: 'iframe',
            contentURL: new URI("uploadlimit.html").setData("hashes", "global").toString(),
            scrollbars: false,
            resizable: false,
            maximizable: false,
            paddingVertical: 0,
            paddingHorizontal: 0,
            width: 424,
            height: 80
        });
    };

    uploadLimitFN = function() {
        const hashes = torrentsTable.selectedRowsIds();
        if (hashes.length) {
            new MochaUI.Window({
                id: 'uploadLimitPage',
                title: "Torrent Upload Speed Limiting",
                loadMethod: 'iframe',
                contentURL: new URI("uploadlimit.html").setData("hashes", hashes.join("|")).toString(),
                scrollbars: false,
                resizable: false,
                maximizable: false,
                paddingVertical: 0,
                paddingHorizontal: 0,
                width: 424,
                height: 80
            });
        }
    };

    shareRatioFN = function() {
        const hashes = torrentsTable.selectedRowsIds();
        if (hashes.length) {
            let shareRatio = null;
            let torrentsHaveSameShareRatio = true;

            // check if all selected torrents have same share ratio
            for (let i = 0; i < hashes.length; ++i) {
                const hash = hashes[i];
                const row = torrentsTable.rows[hash].full_data;
                const origValues = row.ratio_limit + "|" + row.seeding_time_limit + "|" + row.inactive_seeding_time_limit + "|"
                    + row.max_ratio + "|" + row.max_seeding_time + "|" + row.max_inactive_seeding_time;

                // initialize value
                if (shareRatio === null)
                    shareRatio = origValues;

                if (origValues !== shareRatio) {
                    torrentsHaveSameShareRatio = false;
                    break;
                }
            }

            // if all torrents have same share ratio, display that share ratio. else use the default
            const orig = torrentsHaveSameShareRatio ? shareRatio : "";
            new MochaUI.Window({
                id: 'shareRatioPage',
                title: "Torrent Upload/Download Ratio Limiting",
                loadMethod: 'iframe',
                contentURL: new URI("shareratio.html").setData("hashes", hashes.join("|")).setData("orig", orig).toString(),
                scrollbars: false,
                maximizable: false,
                paddingVertical: 0,
                paddingHorizontal: 0,
                width: 424,
                height: 175
            });
        }
    };

    toggleSequentialDownloadFN = function() {
        const hashes = torrentsTable.selectedRowsIds();
        if (hashes.length) {
            new Request({
                url: 'api/v2/torrents/toggleSequentialDownload',
                method: 'post',
                data: {
                    hashes: hashes.join("|")
                }
            }).send();
            updateMainData();
        }
    };

    toggleFirstLastPiecePrioFN = function() {
        const hashes = torrentsTable.selectedRowsIds();
        if (hashes.length) {
            new Request({
                url: 'api/v2/torrents/toggleFirstLastPiecePrio',
                method: 'post',
                data: {
                    hashes: hashes.join("|")
                }
            }).send();
            updateMainData();
        }
    };

    setSuperSeedingFN = function(val) {
        const hashes = torrentsTable.selectedRowsIds();
        if (hashes.length) {
            new Request({
                url: 'api/v2/torrents/setSuperSeeding',
                method: 'post',
                data: {
                    value: val,
                    hashes: hashes.join("|")
                }
            }).send();
            updateMainData();
        }
    };

    setForceStartFN = function() {
        const hashes = torrentsTable.selectedRowsIds();
        if (hashes.length) {
            new Request({
                url: 'api/v2/torrents/setForceStart',
                method: 'post',
                data: {
                    value: 'true',
                    hashes: hashes.join("|")
                }
            }).send();
            updateMainData();
        }
    };

    globalDownloadLimitFN = function() {
        new MochaUI.Window({
            id: 'downloadLimitPage',
            title: "Global Download Speed Limit",
            loadMethod: 'iframe',
            contentURL: new URI("downloadlimit.html").setData("hashes", "global").toString(),
            scrollbars: false,
            resizable: false,
            maximizable: false,
            paddingVertical: 0,
            paddingHorizontal: 0,
            width: 424,
            height: 80
        });
    };

    StatisticsLinkFN = function() {
        const id = 'statisticspage';
        new MochaUI.Window({
            id: id,
            title: 'Statistics',
            loadMethod: 'xhr',
            contentURL: new URI("views/statistics.html").toString(),
            maximizable: false,
            padding: 10,
            width: loadWindowWidth(id, 275),
            height: loadWindowHeight(id, 370),
            onResize: function() {
                saveWindowSize(id);
            }
        });
    };

    downloadLimitFN = function() {
        const hashes = torrentsTable.selectedRowsIds();
        if (hashes.length) {
            new MochaUI.Window({
                id: 'downloadLimitPage',
                title: "Torrent Download Speed Limiting",
                loadMethod: 'iframe',
                contentURL: new URI("downloadlimit.html").setData("hashes", hashes.join("|")).toString(),
                scrollbars: false,
                resizable: false,
                maximizable: false,
                paddingVertical: 0,
                paddingHorizontal: 0,
                width: 424,
                height: 80
            });
        }
    };

    deleteFN = function(deleteFiles = false) {
        const hashes = torrentsTable.selectedRowsIds();
        if (hashes.length) {
            new MochaUI.Window({
                id: 'confirmDeletionPage',
                title: "Remove torrent(s)",
                loadMethod: 'iframe',
                contentURL: new URI("confirmdeletion.html").setData("hashes", hashes.join("|")).setData("deleteFiles", deleteFiles).toString(),
                scrollbars: false,
                resizable: false,
                maximizable: false,
                padding: 10,
                width: 424,
                height: 140
            });
            updateMainData();
        }
    };

    addClickEvent('delete', function(e) {
        new Event(e).stop();
        deleteFN();
    });

    pauseFN = function() {
        const hashes = torrentsTable.selectedRowsIds();
        if (hashes.length) {
            new Request({
                url: 'api/v2/torrents/pause',
                method: 'post',
                data: {
                    hashes: hashes.join("|")
                }
            }).send();
            updateMainData();
        }
    };

    startFN = function() {
        const hashes = torrentsTable.selectedRowsIds();
        if (hashes.length) {
            new Request({
                url: 'api/v2/torrents/resume',
                method: 'post',
                data: {
                    hashes: hashes.join("|")
                }
            }).send();
            updateMainData();
        }
    };

    autoTorrentManagementFN = function() {
        const hashes = torrentsTable.selectedRowsIds();
        if (hashes.length) {
            let enable = false;
            hashes.each(function(hash, index) {
                const row = torrentsTable.rows[hash];
                if (!row.full_data.auto_tmm)
                    enable = true;
            });
            new Request({
                url: 'api/v2/torrents/setAutoManagement',
                method: 'post',
                data: {
                    hashes: hashes.join("|"),
                    enable: enable
                }
            }).send();
            updateMainData();
        }
    };

    recheckFN = function() {
        const hashes = torrentsTable.selectedRowsIds();
        if (hashes.length) {
            new Request({
                url: 'api/v2/torrents/recheck',
                method: 'post',
                data: {
                    hashes: hashes.join("|"),
                }
            }).send();
            updateMainData();
        }
    };

    reannounceFN = function() {
        const hashes = torrentsTable.selectedRowsIds();
        if (hashes.length) {
            new Request({
                url: 'api/v2/torrents/reannounce',
                method: 'post',
                data: {
                    hashes: hashes.join("|"),
                }
            }).send();
            updateMainData();
        }
    };

    setLocationFN = function() {
        const hashes = torrentsTable.selectedRowsIds();
        if (hashes.length) {
            const hash = hashes[0];
            const row = torrentsTable.rows[hash];

            new MochaUI.Window({
                id: 'setLocationPage',
                title: "Set location",
                loadMethod: 'iframe',
                contentURL: new URI("setlocation.html").setData("hashes", hashes.join('|')).setData("path", encodeURIComponent(row.full_data.save_path)).toString(),
                scrollbars: false,
                resizable: true,
                maximizable: false,
                paddingVertical: 0,
                paddingHorizontal: 0,
                width: 400,
                height: 130
            });
        }
    };

    renameFN = function() {
        const hashes = torrentsTable.selectedRowsIds();
        if (hashes.length == 1) {
            const hash = hashes[0];
            const row = torrentsTable.rows[hash];
            if (row) {
                new MochaUI.Window({
                    id: 'renamePage',
                    title: "Rename",
                    loadMethod: 'iframe',
                    contentURL: new URI("rename.html").setData("hash", hash).setData("name", row.full_data.name).toString(),
                    scrollbars: false,
                    resizable: true,
                    maximizable: false,
                    paddingVertical: 0,
                    paddingHorizontal: 0,
                    width: 400,
                    height: 100
                });
            }
        }
    };

    renameFilesFN = function() {
        const hashes = torrentsTable.selectedRowsIds();
        if (hashes.length == 1) {
            const hash = hashes[0];
            const row = torrentsTable.rows[hash];
            if (row) {
                new MochaUI.Window({
                    id: 'multiRenamePage',
                    title: "Renaming",
                    data: { hash: hash, selectedRows: [] },
                    loadMethod: 'xhr',
                    contentURL: 'rename_files.html',
                    scrollbars: false,
                    resizable: true,
                    maximizable: false,
                    paddingVertical: 0,
                    paddingHorizontal: 0,
                    width: 800,
                    height: 420,
                    resizeLimit: { 'x': [800], 'y': [420] }
                });
            }
        }
    };

    torrentNewCategoryFN = function() {
        const action = "set";
        const hashes = torrentsTable.selectedRowsIds();
        if (hashes.length) {
            new MochaUI.Window({
                id: 'newCategoryPage',
                title: "New Category",
                loadMethod: 'iframe',
                contentURL: new URI("newcategory.html").setData("action", action).setData("hashes", hashes.join('|')).toString(),
                scrollbars: false,
                resizable: true,
                maximizable: false,
                paddingVertical: 0,
                paddingHorizontal: 0,
                width: 400,
                height: 150
            });
        }
    };

    torrentSetCategoryFN = function(categoryHash) {
        let categoryName = '';
        if (categoryHash != 0)
            categoryName = category_list[categoryHash].name;
        const hashes = torrentsTable.selectedRowsIds();
        if (hashes.length) {
            new Request({
                url: 'api/v2/torrents/setCategory',
                method: 'post',
                data: {
                    hashes: hashes.join("|"),
                    category: categoryName
                }
            }).send();
        }
    };

    createCategoryFN = function() {
        const action = "create";
        new MochaUI.Window({
            id: 'newCategoryPage',
            title: "New Category",
            loadMethod: 'iframe',
            contentURL: new URI("newcategory.html").setData("action", action).toString(),
            scrollbars: false,
            resizable: true,
            maximizable: false,
            paddingVertical: 0,
            paddingHorizontal: 0,
            width: 400,
            height: 150
        });
        updateMainData();
    };

    createSubcategoryFN = function(categoryHash) {
        const action = "createSubcategory";
        const categoryName = category_list[categoryHash].name + "/";
        new MochaUI.Window({
            id: 'newSubcategoryPage',
            title: "New Category",
            loadMethod: 'iframe',
            contentURL: new URI("newcategory.html").setData("action", action).setData("categoryName", categoryName).toString(),
            scrollbars: false,
            resizable: true,
            maximizable: false,
            paddingVertical: 0,
            paddingHorizontal: 0,
            width: 400,
            height: 150
        });
        updateMainData();
    };

    editCategoryFN = function(categoryHash) {
        const action = "edit";
        const categoryName = category_list[categoryHash].name;
        const savePath = category_list[categoryHash].savePath;
        new MochaUI.Window({
            id: 'editCategoryPage',
            title: "Edit Category",
            loadMethod: 'iframe',
            contentURL: new URI('newcategory.html').setData("action", action).setData("categoryName", categoryName).setData("savePath", savePath).toString(),
            scrollbars: false,
            resizable: true,
            maximizable: false,
            paddingVertical: 0,
            paddingHorizontal: 0,
            width: 400,
            height: 150
        });
        updateMainData();
    };

    removeCategoryFN = function(categoryHash) {
        const categoryName = category_list[categoryHash].name;
        new Request({
            url: 'api/v2/torrents/removeCategories',
            method: 'post',
            data: {
                categories: categoryName
            }
        }).send();
        setCategoryFilter(CATEGORIES_ALL);
    };

    deleteUnusedCategoriesFN = function() {
        const categories = [];
        for (const hash in category_list) {
            if (torrentsTable.getFilteredTorrentsNumber('all', hash, TAGS_ALL, TRACKERS_ALL) === 0)
                categories.push(category_list[hash].name);
        }
        new Request({
            url: 'api/v2/torrents/removeCategories',
            method: 'post',
            data: {
                categories: categories.join('\n')
            }
        }).send();
        setCategoryFilter(CATEGORIES_ALL);
    };

    startTorrentsByCategoryFN = function(categoryHash) {
        const hashes = torrentsTable.getFilteredTorrentsHashes('all', categoryHash, TAGS_ALL, TRACKERS_ALL);
        if (hashes.length) {
            new Request({
                url: 'api/v2/torrents/resume',
                method: 'post',
                data: {
                    hashes: hashes.join("|")
                }
            }).send();
            updateMainData();
        }
    };

    pauseTorrentsByCategoryFN = function(categoryHash) {
        const hashes = torrentsTable.getFilteredTorrentsHashes('all', categoryHash, TAGS_ALL, TRACKERS_ALL);
        if (hashes.length) {
            new Request({
                url: 'api/v2/torrents/pause',
                method: 'post',
                data: {
                    hashes: hashes.join("|")
                }
            }).send();
            updateMainData();
        }
    };

    deleteTorrentsByCategoryFN = function(categoryHash) {
        const hashes = torrentsTable.getFilteredTorrentsHashes('all', categoryHash, TAGS_ALL, TRACKERS_ALL);
        if (hashes.length) {
            new MochaUI.Window({
                id: 'confirmDeletionPage',
                title: "Remove torrent(s)",
                loadMethod: 'iframe',
                contentURL: new URI("confirmdeletion.html").setData("hashes", hashes.join("|")).toString(),
                scrollbars: false,
                resizable: false,
                maximizable: false,
                padding: 10,
                width: 424,
                height: 140
            });
            updateMainData();
        }
    };

    torrentAddTagsFN = function() {
        const action = "set";
        const hashes = torrentsTable.selectedRowsIds();
        if (hashes.length) {
            new MochaUI.Window({
                id: 'newTagPage',
                title: "Add Tags",
                loadMethod: 'iframe',
                contentURL: new URI("newtag.html").setData("action", action).setData("hashes", hashes.join("|")).toString(),
                scrollbars: false,
                resizable: true,
                maximizable: false,
                paddingVertical: 0,
                paddingHorizontal: 0,
                width: 250,
                height: 100
            });
        }
    };

    torrentSetTagsFN = function(tagHash, isSet) {
        const tagName = ((tagHash === '0') ? '' : tagList[tagHash].name);
        const hashes = torrentsTable.selectedRowsIds();
        if (hashes.length) {
            new Request({
                url: (isSet ? 'api/v2/torrents/addTags' : 'api/v2/torrents/removeTags'),
                method: 'post',
                data: {
                    hashes: hashes.join("|"),
                    tags: tagName,
                }
            }).send();
        }
    };

    torrentRemoveAllTagsFN = function() {
        const hashes = torrentsTable.selectedRowsIds();
        if (hashes.length) {
            new Request({
                url: ('api/v2/torrents/removeTags'),
                method: 'post',
                data: {
                    hashes: hashes.join("|"),
                }
            }).send();
        }
    };

    createTagFN = function() {
        const action = "create";
        new MochaUI.Window({
            id: 'newTagPage',
            title: "New Tag",
            loadMethod: 'iframe',
            contentURL: new URI("newtag.html").setData("action", action).toString(),
            scrollbars: false,
            resizable: true,
            maximizable: false,
            paddingVertical: 0,
            paddingHorizontal: 0,
            width: 250,
            height: 100
        });
        updateMainData();
    };

    removeTagFN = function(tagHash) {
        const tagName = tagList[tagHash].name;
        new Request({
            url: 'api/v2/torrents/deleteTags',
            method: 'post',
            data: {
                tags: tagName
            }
        }).send();
        setTagFilter(TAGS_ALL);
    };

    deleteUnusedTagsFN = function() {
        const tags = [];
        for (const hash in tagList) {
            if (torrentsTable.getFilteredTorrentsNumber('all', CATEGORIES_ALL, hash, TRACKERS_ALL) === 0)
                tags.push(tagList[hash].name);
        }
        new Request({
            url: 'api/v2/torrents/deleteTags',
            method: 'post',
            data: {
                tags: tags.join(',')
            }
        }).send();
        setTagFilter(TAGS_ALL);
    };

    startTorrentsByTagFN = function(tagHash) {
        const hashes = torrentsTable.getFilteredTorrentsHashes('all', CATEGORIES_ALL, tagHash, TRACKERS_ALL);
        if (hashes.length) {
            new Request({
                url: 'api/v2/torrents/resume',
                method: 'post',
                data: {
                    hashes: hashes.join("|")
                }
            }).send();
            updateMainData();
        }
    };

    pauseTorrentsByTagFN = function(tagHash) {
        const hashes = torrentsTable.getFilteredTorrentsHashes('all', CATEGORIES_ALL, tagHash, TRACKERS_ALL);
        if (hashes.length) {
            new Request({
                url: 'api/v2/torrents/pause',
                method: 'post',
                data: {
                    hashes: hashes.join("|")
                }
            }).send();
            updateMainData();
        }
    };

    deleteTorrentsByTagFN = function(tagHash) {
        const hashes = torrentsTable.getFilteredTorrentsHashes('all', CATEGORIES_ALL, tagHash, TRACKERS_ALL);
        if (hashes.length) {
            new MochaUI.Window({
                id: 'confirmDeletionPage',
                title: "Remove torrent(s)",
                loadMethod: 'iframe',
                contentURL: new URI("confirmdeletion.html").setData("hashes", hashes.join("|")).toString(),
                scrollbars: false,
                resizable: false,
                maximizable: false,
                padding: 10,
                width: 424,
                height: 140
            });
            updateMainData();
        }
    };

    resumeTorrentsByTrackerFN = function(trackerHash) {
        const trackerHashInt = Number.parseInt(trackerHash, 10);
        let hashes = [];
        switch (trackerHashInt) {
            case TRACKERS_ALL:
                hashes = torrentsTable.getFilteredTorrentsHashes('all', CATEGORIES_ALL, TAGS_ALL, TRACKERS_ALL);
                break;
            case TRACKERS_TRACKERLESS:
                hashes = torrentsTable.getFilteredTorrentsHashes('all', CATEGORIES_ALL, TAGS_ALL, TRACKERS_TRACKERLESS);
                break;
            default:
                hashes = trackerList.get(trackerHashInt).torrents;
                break;
        }

        if (hashes.length > 0) {
            new Request({
                url: 'api/v2/torrents/resume',
                method: 'post',
                data: {
                    hashes: hashes.join("|")
                }
            }).send();
            updateMainData();
        }
    };

    pauseTorrentsByTrackerFN = function(trackerHash) {
        const trackerHashInt = Number.parseInt(trackerHash, 10);
        let hashes = [];
        switch (trackerHashInt) {
            case TRACKERS_ALL:
                hashes = torrentsTable.getFilteredTorrentsHashes('all', CATEGORIES_ALL, TAGS_ALL, TRACKERS_ALL);
                break;
            case TRACKERS_TRACKERLESS:
                hashes = torrentsTable.getFilteredTorrentsHashes('all', CATEGORIES_ALL, TAGS_ALL, TRACKERS_TRACKERLESS);
                break;
            default:
                hashes = trackerList.get(trackerHashInt).torrents;
                break;
        }

        if (hashes.length) {
            new Request({
                url: 'api/v2/torrents/pause',
                method: 'post',
                data: {
                    hashes: hashes.join("|")
                }
            }).send();
            updateMainData();
        }
    };

    deleteTorrentsByTrackerFN = function(trackerHash) {
        const trackerHashInt = Number.parseInt(trackerHash, 10);
        let hashes = [];
        switch (trackerHashInt) {
            case TRACKERS_ALL:
                hashes = torrentsTable.getFilteredTorrentsHashes('all', CATEGORIES_ALL, TAGS_ALL, TRACKERS_ALL);
                break;
            case TRACKERS_TRACKERLESS:
                hashes = torrentsTable.getFilteredTorrentsHashes('all', CATEGORIES_ALL, TAGS_ALL, TRACKERS_TRACKERLESS);
                break;
            default:
                hashes = trackerList.get(trackerHashInt).torrents;
                break;
        }

        if (hashes.length) {
            new MochaUI.Window({
                id: 'confirmDeletionPage',
                title: "Remove torrent(s)",
                loadMethod: 'iframe',
                contentURL: new URI("confirmdeletion.html").setData("hashes", hashes.join("|")).toString(),
                scrollbars: false,
                resizable: false,
                maximizable: false,
                padding: 10,
                width: 424,
                height: 140,
                onCloseComplete: function() {
                    updateMainData();
                    setTrackerFilter(TRACKERS_ALL);
                }
            });
        }
    };

    copyNameFN = function() {
        const selectedRows = torrentsTable.selectedRowsIds();
        const names = [];
        if (selectedRows.length > 0) {
            const rows = torrentsTable.getFilteredAndSortedRows();
            for (let i = 0; i < selectedRows.length; ++i) {
                const hash = selectedRows[i];
                names.push(rows[hash].full_data.name);
            }
        }
        return names.join("\n");
    };

    copyInfohashFN = function(policy) {
        const selectedRows = torrentsTable.selectedRowsIds();
        const infohashes = [];
        if (selectedRows.length > 0) {
            const rows = torrentsTable.getFilteredAndSortedRows();
            switch (policy) {
                case 1:
                    for (const id of selectedRows) {
                        const infohash = rows[id].full_data.infohash_v1;
                        if (infohash !== "")
                            infohashes.push(infohash);
                    }
                    break;
                case 2:
                    for (const id of selectedRows) {
                        const infohash = rows[id].full_data.infohash_v2;
                        if (infohash !== "")
                            infohashes.push(infohash);
                    }
                    break;
            }
        }
        return infohashes.join("\n");
    };

    copyMagnetLinkFN = function() {
        const selectedRows = torrentsTable.selectedRowsIds();
        const magnets = [];
        if (selectedRows.length > 0) {
            const rows = torrentsTable.getFilteredAndSortedRows();
            for (let i = 0; i < selectedRows.length; ++i) {
                const hash = selectedRows[i];
                magnets.push(rows[hash].full_data.magnet_uri);
            }
        }
        return magnets.join("\n");
    };

    copyIdFN = function() {
        return torrentsTable.selectedRowsIds().join("\n");
    };

    exportTorrentFN = async function() {
        const hashes = torrentsTable.selectedRowsIds();
        for (const hash of hashes) {
            const row = torrentsTable.rows.get(hash);
            if (!row)
                continue;

            const name = row.full_data.name;
            const url = new URI("api/v2/torrents/export");
            url.setData("hash", hash);

            // download response to file
            const element = document.createElement("a");
            element.setAttribute("href", url);
            element.setAttribute("download", (name + ".torrent"));
            document.body.appendChild(element);
            element.click();
            document.body.removeChild(element);

            // https://stackoverflow.com/questions/53560991/automatic-file-downloads-limited-to-10-files-on-chrome-browser
            await window.qBittorrent.Misc.sleep(200);
        }
    };

    addClickEvent('pauseAll', (e) => {
        new Event(e).stop();

        if (confirm('Would you like to pause all torrents?')) {
            new Request({
                url: 'api/v2/torrents/pause',
                method: 'post',
                data: {
                    hashes: "all"
                }
            }).send();
            updateMainData();
        }
    });

    addClickEvent('resumeAll', (e) => {
        new Event(e).stop();

        if (confirm('Would you like to resume all torrents?')) {
            new Request({
                url: 'api/v2/torrents/resume',
                method: 'post',
                data: {
                    hashes: "all"
                }
            }).send();
            updateMainData();
        }
    });

    ['pause', 'resume', 'recheck'].each(function(item) {
        addClickEvent(item, function(e) {
            new Event(e).stop();
            const hashes = torrentsTable.selectedRowsIds();
            if (hashes.length) {
                hashes.each(function(hash, index) {
                    new Request({
                        url: 'api/v2/torrents/' + item,
                        method: 'post',
                        data: {
                            hashes: hash
                        }
                    }).send();
                });
                updateMainData();
            }
        });
    });

    ['decreasePrio', 'increasePrio', 'topPrio', 'bottomPrio'].each(function(item) {
        addClickEvent(item, function(e) {
            new Event(e).stop();
            setQueuePositionFN(item);
        });
    });

    setQueuePositionFN = function(cmd) {
        const hashes = torrentsTable.selectedRowsIds();
        if (hashes.length) {
            new Request({
                url: 'api/v2/torrents/' + cmd,
                method: 'post',
                data: {
                    hashes: hashes.join("|")
                }
            }).send();
            updateMainData();
        }
    };

    addClickEvent('about', function(e) {
        new Event(e).stop();
        const id = 'aboutpage';
        new MochaUI.Window({
            id: id,
            title: 'About qBittorrent',
            loadMethod: 'xhr',
            contentURL: new URI("views/about.html").toString(),
            require: {
                css: ['css/Tabs.css']
            },
            toolbar: true,
            toolbarURL: 'views/aboutToolbar.html',
            padding: 10,
            width: loadWindowWidth(id, 550),
            height: loadWindowHeight(id, 360),
            onResize: function() {
                saveWindowSize(id);
            }
        });
    });

    addClickEvent('logout', function(e) {
        new Event(e).stop();
        new Request({
            url: 'api/v2/auth/logout',
            method: 'post',
            onSuccess: function() {
                window.location.reload(true);
            }
        }).send();
    });

    addClickEvent('shutdown', function(e) {
        new Event(e).stop();
        if (confirm('Are you sure you want to quit qBittorrent?')) {
            new Request({
                url: 'api/v2/app/shutdown',
                method: 'post',
                onSuccess: function() {
                    document.write('<!doctype html><html lang="${LANG}"><head> <meta charset="UTF-8"> <title>qBittorrent has been shutdown</title></head><body> <h1 style="text-align: center;">qBittorrent has been shutdown</h1></body></html>');
                    document.close();
                    stop();
                }
            }).send();
        }
    });

    // Deactivate menu header links
    $$('a.returnFalse').each(function(el) {
        el.addEvent('click', function(e) {
            new Event(e).stop();
        });
    });
};
