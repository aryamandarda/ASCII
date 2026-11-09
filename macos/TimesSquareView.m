#import <ScreenSaver/ScreenSaver.h>
#import <WebKit/WebKit.h>

// Unique class name avoids collisions when the host loads multiple saver bundles.
@interface ADTimesSquareSaverView : ScreenSaverView <WKNavigationDelegate>
@property(nonatomic, strong) WKWebView *webView;
@property(nonatomic, strong) NSURL *artworkRoot;
@end

@implementation ADTimesSquareSaverView
- (instancetype)initWithFrame:(NSRect)frame isPreview:(BOOL)isPreview {
    self = [super initWithFrame:frame isPreview:isPreview];
    if (self) {
        self.animationTimeInterval = 1.0 / 24.0;
        self.wantsLayer = YES;
        self.layer.backgroundColor = NSColor.blackColor.CGColor;
        self.artworkRoot = [[NSBundle bundleForClass:self.class] URLForResource:@"Artwork" withExtension:nil];
    }
    return self;
}
- (BOOL)hasConfigureSheet { return NO; }
- (void)startAnimation {
    [super startAnimation];
    if (self.webView || !self.artworkRoot) return;
    WKWebViewConfiguration *configuration = [WKWebViewConfiguration new];
    configuration.websiteDataStore = WKWebsiteDataStore.nonPersistentDataStore;
    WKWebView *view = [[WKWebView alloc] initWithFrame:self.bounds configuration:configuration];
    view.autoresizingMask = NSViewWidthSizable | NSViewHeightSizable;
    view.navigationDelegate = self;
    self.webView = view;
    [self addSubview:view];
    NSURL *index = [self.artworkRoot URLByAppendingPathComponent:@"index.html"];
    [view loadFileURL:index allowingReadAccessToURL:self.artworkRoot];
}
- (void)stopAnimation {
    [super stopAnimation];
    // Tear down the web view to stop animation, timers, worker and GPU work.
    WKWebView *view = self.webView;
    self.webView = nil;
    view.navigationDelegate = nil;
    [view stopLoading];
    [view loadHTMLString:@"" baseURL:nil];
    [view removeFromSuperview];
}
- (void)animateOneFrame { /* The shared renderer owns its requestAnimationFrame loop. */ }
- (void)webView:(WKWebView *)webView decidePolicyForNavigationAction:(WKNavigationAction *)action decisionHandler:(void (^)(WKNavigationActionPolicy))decisionHandler {
    NSURL *url = action.request.URL;
    NSString *root = [self.artworkRoot.URLByResolvingSymlinksInPath.path stringByAppendingString:@"/"];
    BOOL local = url.isFileURL && [url.URLByResolvingSymlinksInPath.path hasPrefix:root];
    decisionHandler(local ? WKNavigationActionPolicyAllow : WKNavigationActionPolicyCancel);
}
- (void)webViewWebContentProcessDidTerminate:(WKWebView *)webView {
    if (self.isAnimating && webView == self.webView) {
        [self stopAnimation];
        [self startAnimation];
    }
}
@end
