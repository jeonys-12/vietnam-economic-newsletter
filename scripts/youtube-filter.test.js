import test from "node:test";
import assert from "node:assert/strict";
import { isRelevantYouTubeVideo, normalizeYouTubeText } from "./youtube-filter.js";

test("normalizes Vietnamese accents, punctuation, and hidden characters", () => {
  assert.equal(normalizeYouTubeText("King Crown Thảo\u200B Điền"), "king crown thao dien");
});

test("accepts confirmed King Crown and BCG business videos", () => {
  assert.equal(isRelevantYouTubeVideo({ query: "King Crown Thảo Điền", title: "Tiến độ King Crown Thảo Điền", channelTitle: "Bất động sản TP.HCM" }), true);
  assert.equal(isRelevantYouTubeVideo({ query: "BCG Land", title: "BCG Land công bố thông tin trái phiếu", channelTitle: "Tài chính Việt Nam" }), true);
  assert.equal(isRelevantYouTubeVideo({ query: "Bamboo Capital", title: "BCG: cập nhật doanh nghiệp và cổ phiếu", channelTitle: "Tài chính Việt Nam" }), true);
  assert.equal(isRelevantYouTubeVideo({ query: "Sao Sáng Sài Gòn SSSG", title: "Dự án SSSG tại Việt Nam", channelTitle: "Real Estate News" }), true);
});

test("rejects story, museum, and unrelated overseas real-estate false positives", () => {
  assert.equal(isRelevantYouTubeVideo({ query: "King Crown Thảo Điền", title: "The poor boy became a king and won the crown", channelTitle: "RealmTales" }), false);
  assert.equal(isRelevantYouTubeVideo({ query: "Bamboo Capital", title: "Damyang Bamboo Museum tour", channelTitle: "Travel World" }), false);
  assert.equal(isRelevantYouTubeVideo({ query: "King Crown Village", title: "Luxury home tour in Crown Village", channelTitle: "Melissa Quade, Realtor" }), false);
  assert.equal(isRelevantYouTubeVideo({ query: "BCG Land", title: "Boston Consulting Group leadership talk", channelTitle: "Global Consulting" }), false);
});
