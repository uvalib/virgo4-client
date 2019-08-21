package main

import (
	"encoding/xml"
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

// UserSettings contains virgo4 user data like session token, bookmarks and preferences
type UserSettings struct {
	ID              int              `db:"id" json:"-"`
	Virgo4ID        string           `db:"virgo4_id" json:"id"`
	AuthToken       string           `db:"auth_token" json:"-"`
	AuthUpdatedAt   time.Time        `db:"auth_updated_at" json:"-"`
	SignedIn        bool             `db:"signed_in" json:"-"`
	BookMarkFolders []BookMarkFolder `json:"bookmarkFolders"`
}

// TableName sets the name of the table in the DB that this struct binds to
func (e *UserSettings) TableName() string {
	return "users"
}

// BookMarkFolder is a named container for bookmarks
type BookMarkFolder struct {
	Name  string           `dynamodbav:"name" json:"name"`
	Items []BookMarkedItem `dynamodbav:"items"  json:"items"`
}

// BookMarkedItem contains minimal details on a bookmarked item
type BookMarkedItem struct {
	CatalogKey string `dynamodbav:"catalogKey" json:"catalogKey"`
	Title      string `dynamodbav:"title" json:"title"`
	Author     string `dynamodbav:"author" json:"author"`
	Format     string `dynamodbav:"format" json:"format"`
}

// ILSUserInfo contains ILS connector details for a user
type ILSUserInfo struct {
	ID                 string `json:"id"`
	DisplayName        string `xml:"displayName" json:"displayName"`
	Title              string `xml:"title" json:"title"`
	Profile            string `xml:"profile" json:"profile"`
	OrganizationalUnit string `xml:"organizationalUnit" json:"organizationalUnit"`
	Address            string `xml:"physicalDelivery" json:"address"`
	Email              string `xml:"email" json:"email"`
	TotalCheckouts     int    `xml:"totalCheckouts" json:"totalCheckouts"`
	TotalHolds         int    `xml:"totalHolds" json:"totalHolds"`
	TotalOverdue       int    `xml:"totalOverdue" json:"totalOverdue"`
	TotalRecalls       int    `xml:"totalRecalls" json:"totalRecalls"`
	TotalReserves      int    `xml:"totalReserves" json:"totalReserves"`
}

// User contains all user data collected from ILS and Virgo4 sources
type User struct {
	*ILSUserInfo
	AccessToken     string            `json:"acessToken"`
	BookMarkFolders *[]BookMarkFolder `json:"bookmarkFolders"`
}

// GetUser uses ILS Connector V2 API /users to get details for a user
func (svc *ServiceContext) GetUser(c *gin.Context) {
	userID := c.Param("id")
	log.Printf("Get info for user %s with ILS Connector...", userID)

	userURL := fmt.Sprintf("%s/users/%s", svc.ILSAPI, userID)
	bodyBytes, ilsErr := svc.ILSConnectorGet(userURL)
	if ilsErr != nil {
		c.String(ilsErr.StatusCode, ilsErr.Message)
		return
	}

	var ilsUser ILSUserInfo
	log.Printf("Raw user response %s", bodyBytes)
	if err := xml.Unmarshal(bodyBytes, &ilsUser); err != nil {
		log.Printf("ERROR: unable to parse user response: %s", err.Error())
		c.String(http.StatusInternalServerError, err.Error())
		return
	}
	ilsUser.ID = userID

	log.Printf("Load other user settings from v4 internal data source")
	userSettings := UserSettings{}
	// result, err := svc.DynamoDB.GetItem(&dynamodb.GetItemInput{
	// 	TableName: aws.String(svc.UsersTable),
	// 	Key: map[string]*dynamodb.AttributeValue{
	// 		"userID": {
	// 			S: aws.String(userID),
	// 		},
	// 	},
	// })
	// if err != nil {
	// 	log.Printf("WARNING: Unable to get user settings for %s: %v", userID, err)
	// } else {
	// 	err = dynamodbattribute.UnmarshalMap(result.Item, &userSettings)
	// 	if err != nil {
	// 		log.Printf("ERROR: unable to unmarshal user %s settings, %v", userID, err)
	// 	}
	// }

	user := User{&ilsUser, userSettings.AuthToken, &userSettings.BookMarkFolders}
	c.JSON(http.StatusOK, user)
}
