//
//  ZSSBarButtonItem.h
//  ZSSRichTextEditor
//
//  Created by Nicholas Hubbard on 12/3/13.
//  Copyright (c) 2013 Zed Said Studio. All rights reserved.
//

#import <UIKit/UIKit.h>

typedef NS_ENUM(NSInteger, ZSSBarButtonDefaultItem) {
    ZSSBarButtonDefaultItemBold = 1,
    ZSSBarButtonDefaultItemItalic,
    ZSSBarButtonDefaultItemSubscript,
    ZSSBarButtonDefaultItemSuperscript,
    ZSSBarButtonDefaultItemStrikeThrough,
    ZSSBarButtonDefaultItemUnderline,
    ZSSBarButtonDefaultItemRemoveFormat,
    ZSSBarButtonDefaultItemJustifyLeft,
    ZSSBarButtonDefaultItemJustifyCenter,
    ZSSBarButtonDefaultItemJustifyRight,
    ZSSBarButtonDefaultItemJustifyFull,
    ZSSBarButtonDefaultItemH1,
    ZSSBarButtonDefaultItemH2,
    ZSSBarButtonDefaultItemH3,
    ZSSBarButtonDefaultItemH4,
    ZSSBarButtonDefaultItemH5,
    ZSSBarButtonDefaultItemH6,
    ZSSBarButtonDefaultItemTextColor,
    ZSSBarButtonDefaultItemUnorderedList,
    ZSSBarButtonDefaultItemOrderedList,
    ZSSBarButtonDefaultItemHorizontalRule,
    ZSSBarButtonDefaultItemIndent,
    ZSSBarButtonDefaultItemOutdent,
    ZSSBarButtonDefaultItemInsertLink,
    ZSSBarButtonDefaultItemRemoveLink,
    ZSSBarButtonDefaultItemQuickLink,
    ZSSBarButtonDefaultItemUndo,
    ZSSBarButtonDefaultItemRedo,
    ZSSBarButtonDefaultItemParagraph,
};

@interface ZSSBarButtonItem : UIBarButtonItem

@property (nonatomic, strong) NSString *label;

+ (ZSSBarButtonItem *)barButtonItemForDefaultType:(NSString *)defaultType;

@end
