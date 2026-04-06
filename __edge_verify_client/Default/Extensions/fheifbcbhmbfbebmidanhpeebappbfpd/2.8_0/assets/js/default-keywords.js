// Default keywords for each protection level
const DEFAULT_KEYWORDS = {
    // Lite level - Basic protection keywords (کیوردهای اساسی)
    LITE: [
        "porn", "xxx", "adult", "nude", "naked", 
        "nsfw", "escort", "onlyfans", "chaturbate",
        "xvideos", "xhamster", "pornhub", "redtube"
    ],
    
    // Balanced level - Extended protection (محافظت متوسط)
    BALANCED: [
        // Include all Lite keywords
        "porn", "xxx", "adult", "nude", "naked",
        "nsfw", "escort", "webcam", "onlyfans", "chaturbate",
        "xvideos", "xhamster", "pornhub", "redtube", "youporn",
        // Additional Balanced keywords
        "erotic", "fetish", "milf", "teen", "amateur",
        "hardcore", "blowjob", "lesbian",
        "shemale", "hentai", "bdsm", "stripchat",
        "livejasmin", "myfreecams", "streamate", "flirt4free",
        "camgirl", "camboy", "sexcam", "livesex"
    ],
    
    // Ultimate level - Maximum protection (محافظت حداکثری) 
    ULTIMATE: [
        // Include all Balanced keywords
        "porn", "xxx", "sex", "adult", "nude", "naked",
        "nsfw", "escort", "onlyfans", "chaturbate",
        "xvideos", "xhamster", "pornhub", "redtube", "youporn",
        "erotic", "fetish", "milf", "teen", "amateur",
        "hardcore", "blowjob", "lesbian",
        "shemale", "hentai", "bdsm", "stripchat", "cam4",
        "livejasmin", "myfreecams", "streamate", "flirt4free",
        "camgirl", "camboy", "sexcam", "livesex", "fap",
        // Additional Ultimate keywords
        "boobs", "tits", "pussy", "dick", "cock",
        "fuck", "cumshot", "creampie", "gangbang", "orgy",
        "squirt", "masturbat", "dildo", "vibrator", "sextoy",
        "playboy", "penthouse", "hustler", "brazzers", "naughty",
        "kinky", "spank", "bondage", "dominatrix", "submissive",
        "voyeur", "upskirt", "downblouse", "nipple", "topless",
        "bikini", "lingerie", "thong", "hooker", "prostitut",
        "hookup", "affair"
    ]
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DEFAULT_KEYWORDS;
}

