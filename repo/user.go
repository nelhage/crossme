package repo

import (
	"database/sql"
	"time"

	"crossme.app/src/pb"
	"google.golang.org/protobuf/proto"
	"google.golang.org/protobuf/types/known/timestamppb"
)

// UserById looks up a user by our own id (never a provider's subject).
func (r *Repository) UserById(id string) (*pb.User, error) {
	var data []byte
	if err := namedGet(r.db, &data, sql_query_user_by_id, query_user_by_id_args{
		Id: id,
	}); err != nil {
		if err == sql.ErrNoRows {
			err = ErrNoSuchUser
		}
		return nil, err
	}
	var out pb.User
	if err := proto.Unmarshal(data, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

// LoginUser resolves an external identity to a User, creating the user on
// first login. `profile` carries the provider's current claims (email,
// display name, avatar); on a returning user those fields are refreshed,
// since they can change at the provider. Users are matched only by
// (provider, subject) — never by email, which providers can recycle.
func (r *Repository) LoginUser(provider, subject string, profile *pb.User) (*pb.User, error) {
	tx, err := r.db.Beginx()
	if err != nil {
		return nil, err
	}
	defer tx.Rollback()

	var data []byte
	err = namedGet(tx, &data, sql_query_user_by_identity, query_user_by_identity_args{
		Provider: provider,
		Subject:  subject,
	})
	if err == nil {
		var user pb.User
		if err := proto.Unmarshal(data, &user); err != nil {
			return nil, err
		}
		if user.Email == profile.Email &&
			user.DisplayName == profile.DisplayName &&
			user.AvatarUrl == profile.AvatarUrl {
			return &user, nil
		}
		user.Email = profile.Email
		user.DisplayName = profile.DisplayName
		user.AvatarUrl = profile.AvatarUrl
		userbytes, err := proto.Marshal(&user)
		if err != nil {
			return nil, err
		}
		if _, err := tx.NamedExec(sql_update_user, &update_user_args{
			Id:    user.Id,
			Proto: userbytes,
		}); err != nil {
			return nil, err
		}
		return &user, tx.Commit()
	}
	if err != sql.ErrNoRows {
		return nil, err
	}

	now := timestamppb.New(time.Now())
	user := &pb.User{
		Id:          NewId(),
		Email:       profile.Email,
		DisplayName: profile.DisplayName,
		AvatarUrl:   profile.AvatarUrl,
		Created:     now,
	}
	ident := &pb.Identity{
		Provider: provider,
		Subject:  subject,
		UserId:   user.Id,
		Created:  now,
	}

	userbytes, err := proto.Marshal(user)
	if err != nil {
		return nil, err
	}
	if _, err := tx.NamedExec(sql_insert_user, &insert_user_args{
		Proto:   userbytes,
		Id:      user.Id,
		Created: formatTime(now.AsTime()),
	}); err != nil {
		return nil, err
	}

	identbytes, err := proto.Marshal(ident)
	if err != nil {
		return nil, err
	}
	if _, err := tx.NamedExec(sql_insert_identity, &insert_identity_args{
		Proto:    identbytes,
		Provider: provider,
		Subject:  subject,
		UserId:   user.Id,
	}); err != nil {
		return nil, err
	}

	return user, tx.Commit()
}
