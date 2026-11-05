// Open the pull request itself when GitHub 404s its commit range, as it does after a force-push rewrites the range away.
const navigation = performance.getEntriesByType('navigation')[0];
if (navigation.responseStatus === 404) {
    location.replace(location.pathname.replace(/\/changes\/.*$/, '/'));
}
