from .graphql import *

def authorizedScopes(appKey):
    appScopes = GraphQL().run(
            """
            query getScopes($key:String!) {
                appByKey($key) {
                    availableAccessScopes {
                        handle
                    }
                }
            }
            """,
            {
                "key":appKey
            }
        )
    return [x.get("handle") for x in appScopes.search("data.appByKey.availableAccessScopes")]

def getThemes():
    themes = []
    for themeGroup in GraphQL().iterable(
        """
        query getThemes($after:String) {
            themes(first:100,after:$after) {
                nodes {
                    id
                    name
                }
                pageInfo {
                    hasNextPage
                    endCursor
                }
            }
        }
        """,
        {
            "after":None
        }
    ):
        for theme in themeGroup:
            themes.append(
                {
                    "id":theme.get("id"),
                    "name":theme.get("name")
                }
            )
    return themes
def getOriginalThemeFile(themeId,fileName):
    theme = GraphQL().run(
        """
        query backupThemeFile($themeId:ID!,$fileNames:[String!]) {
            theme(id:$themeId) {
                id
                name
                files(filenames:$fileNames,first:1) {
                    nodes {
                        body {
                            ... on OnlineStoreThemeFileBodyBase64 {
                                content: contentBase64
                            }
                            ... on OnlineStoreThemeFileBodyText {
                                content
                            }
                        }
                        filename
                        contentType
                    }
                }
            }
        }
        """,
        {
            "themeId":themeId,
            "fileName":[fileName]
        }
    )